import { qualifiedLaserEyes } from "../qualification.ts";
import type {
  WalletCapability,
  WalletConformanceCheck,
  WalletQualificationCandidate,
  WalletQualificationEvidence,
  WalletQualificationPolicy,
  WalletQualificationResult,
} from "./contracts.ts";
import { environmentParts, matrixKey } from "./matrix-key.ts";
import { policyFailures } from "./validate-policy.ts";

export type {
  LaserEyesProviderId,
  QualifiedWalletProvider,
  WalletCapability,
  WalletConformanceCheck,
  WalletConformanceOutcome,
  WalletQualificationCandidate,
  WalletQualificationEvidence,
  WalletQualificationPolicy,
  WalletQualificationResult,
  WalletTestEnvironment,
} from "./contracts.ts";

const checksByCapability = {
  connect: [
    "connect-approved",
    "connect-rejected",
    "account-change",
    "network-change",
  ],
  "message-sign": [
    "message-approved",
    "message-rejected",
    "message-server-verified",
  ],
  "psbt-sign": [
    "psbt-approved",
    "psbt-rejected",
    "psbt-server-verified",
    "alkanes-fixture-matched",
  ],
} as const satisfies Readonly<
  Record<WalletCapability, readonly WalletConformanceCheck[]>
>;

function evidenceKey(evidence: WalletQualificationEvidence): string {
  return matrixKey([
    evidence.provider,
    evidence.walletVersion,
    ...environmentParts(evidence),
    evidence.network,
    evidence.addressType,
    evidence.signingScheme,
    evidence.check,
  ]);
}

function requiredKeys(
  candidate: WalletQualificationCandidate,
  policy: WalletQualificationPolicy,
): readonly string[] {
  return candidate.capabilities.flatMap((capability) =>
    policy.environments.flatMap((environment) =>
      policy.networks.flatMap((network) =>
        policy.addressTypes.flatMap((addressType) =>
          schemesForCapability(capability, policy).flatMap((signingScheme) =>
            checksByCapability[capability].map((check) =>
              matrixKey([
                candidate.provider,
                candidate.walletVersion,
                ...environmentParts(environment),
                network,
                addressType,
                signingScheme,
                check,
              ]),
            ),
          ),
        ),
      ),
    ),
  );
}

function schemesForCapability(
  capability: WalletCapability,
  policy: WalletQualificationPolicy,
): readonly WalletQualificationEvidence["signingScheme"][] {
  return capability === "message-sign"
    ? policy.messageSigningSchemes
    : ["not-applicable"];
}

function evidenceFailure(
  evidence: WalletQualificationEvidence,
  policy: WalletQualificationPolicy,
  nowMs: number,
): string | undefined {
  const observedAtMs = Date.parse(evidence.observedAt);
  if (!Number.isFinite(observedAtMs))
    return "has an invalid observation timestamp";
  if (observedAtMs > nowMs) return "was observed in the future";
  if (nowMs - observedAtMs > policy.maximumEvidenceAgeMs) return "is stale";
  if (
    evidence.versions.core !== qualifiedLaserEyes.coreVersion ||
    evidence.versions.react !== qualifiedLaserEyes.reactVersion
  ) {
    return "targets a different LaserEyes version";
  }
  if (evidence.fixtureId !== policy.fixtureId)
    return "targets a different fixture";
  const messageChecks: readonly WalletConformanceCheck[] =
    checksByCapability["message-sign"];
  const isMessageCheck = messageChecks.includes(evidence.check);
  if (isMessageCheck === (evidence.signingScheme === "not-applicable")) {
    return "uses an incompatible signing scheme";
  }
  if (evidence.outcome === "failed") return "failed";
  return undefined;
}

export function evaluateWalletQualifications(input: {
  readonly candidates: readonly WalletQualificationCandidate[];
  readonly evidence: readonly WalletQualificationEvidence[];
  readonly nowMs: number;
  readonly policy: WalletQualificationPolicy;
}): WalletQualificationResult {
  const failures = [...policyFailures(input.policy)];
  if (!Number.isFinite(input.nowMs))
    failures.push("Evaluation time must be finite.");
  const policyIsValid = failures.length === 0;
  const accepted = new Set<string>();
  const rejected = new Set<string>();
  const invalidProviders = new Set<string>();

  for (const evidence of input.evidence) {
    const key = evidenceKey(evidence);
    const failure = evidenceFailure(evidence, input.policy, input.nowMs);
    if (accepted.has(key) || rejected.has(key)) {
      failures.push(`${key} has duplicate evidence.`);
      rejected.add(key);
      accepted.delete(key);
      invalidProviders.add(evidence.provider);
    } else if (failure !== undefined) {
      failures.push(`${key} ${failure}.`);
      rejected.add(key);
      invalidProviders.add(evidence.provider);
    } else accepted.add(key);
  }

  const configuredProviders = new Set<string>();
  const duplicateProviders = new Set<string>();
  for (const candidate of input.candidates) {
    if (configuredProviders.has(candidate.provider)) {
      duplicateProviders.add(candidate.provider);
    }
    configuredProviders.add(candidate.provider);
  }

  const enabled = input.candidates.flatMap((candidate) => {
    const failuresBeforeCandidate = failures.length;
    if (candidate.capabilities.length === 0) {
      failures.push(`${candidate.provider} requests no capabilities.`);
    }
    if (candidate.walletVersion.trim().length === 0) {
      failures.push(`${candidate.provider} has no wallet version.`);
    }
    if (
      new Set(candidate.capabilities).size !== candidate.capabilities.length
    ) {
      failures.push(`${candidate.provider} requests duplicate capabilities.`);
    }
    if (
      candidate.capabilities.length > 0 &&
      !candidate.capabilities.includes("connect")
    ) {
      failures.push(
        `${candidate.provider} requests signing without connection.`,
      );
    }
    if (
      candidate.capabilities.includes("message-sign") &&
      input.policy.messageSigningSchemes.length === 0
    ) {
      failures.push(
        `${candidate.provider} has no required message signing scheme.`,
      );
    }
    if (duplicateProviders.has(candidate.provider)) {
      failures.push(`${candidate.provider} is configured more than once.`);
    }
    const missing = requiredKeys(candidate, input.policy).filter(
      (key) => !accepted.has(key),
    );
    failures.push(...missing.map((key) => `${key} has no passing evidence.`));
    return policyIsValid &&
      !invalidProviders.has(candidate.provider) &&
      failures.length === failuresBeforeCandidate
      ? [candidate]
      : [];
  });

  return { enabled, failures };
}
