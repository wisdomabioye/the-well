import type {
  WalletQualificationCandidate,
  WalletQualificationEvidence,
  WalletQualificationPolicy,
} from "../src/conformance/contracts.ts";
import { evaluateWalletQualifications } from "../src/conformance/evaluate.ts";
import { qualifiedLaserEyes } from "../src/qualification.ts";

export const nowMs = Date.parse("2026-09-12T12:00:00.000Z");
export const candidate = {
  capabilities: ["connect"],
  provider: "xverse",
  walletVersion: "1.0.0",
} as const satisfies WalletQualificationCandidate;
export const policy = {
  addressTypes: ["p2tr"],
  environments: [
    {
      browser: { name: "chromium", version: "140.0.0" },
      device: { category: "desktop", os: "Linux" },
    },
  ],
  fixtureId: "wallet-conformance-v1",
  maximumEvidenceAgeMs: 86_400_000,
  messageSigningSchemes: ["bip322"],
  networks: ["signet"],
} as const satisfies WalletQualificationPolicy;
const versions = {
  core: qualifiedLaserEyes.coreVersion,
  react: qualifiedLaserEyes.reactVersion,
};

export function evidence(
  check: WalletQualificationEvidence["check"],
  overrides: Partial<WalletQualificationEvidence> = {},
): WalletQualificationEvidence {
  return {
    addressType: "p2tr",
    browser: policy.environments[0].browser,
    check,
    device: policy.environments[0].device,
    fixtureId: policy.fixtureId,
    network: "signet",
    observedAt: "2026-09-12T11:00:00.000Z",
    outcome: "passed",
    provider: "xverse",
    signingScheme: "not-applicable",
    versions,
    walletVersion: candidate.walletVersion,
    ...overrides,
  };
}

export const passingConnectEvidence = [
  evidence("connect-approved"),
  evidence("connect-rejected"),
  evidence("account-change"),
  evidence("network-change"),
];

export function evaluate(
  overrides: Partial<Parameters<typeof evaluateWalletQualifications>[0]> = {},
) {
  return evaluateWalletQualifications({
    candidates: [candidate],
    evidence: passingConnectEvidence,
    nowMs,
    policy,
    ...overrides,
  });
}
