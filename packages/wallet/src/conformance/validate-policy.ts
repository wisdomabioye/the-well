import type { WalletQualificationPolicy } from "./contracts.ts";
import { environmentParts, matrixKey } from "./matrix-key.ts";

export function policyFailures(
  policy: WalletQualificationPolicy,
): readonly string[] {
  const failures: string[] = [];
  if (policy.addressTypes.length === 0)
    failures.push("No address types are required.");
  if (policy.environments.length === 0)
    failures.push("No environments are required.");
  if (policy.fixtureId.trim().length === 0)
    failures.push("No fixture is required.");
  if (
    !Number.isFinite(policy.maximumEvidenceAgeMs) ||
    !(policy.maximumEvidenceAgeMs > 0)
  )
    failures.push("Evidence lifetime must be positive.");
  if (policy.networks.length === 0) failures.push("No networks are required.");
  if (new Set(policy.addressTypes).size !== policy.addressTypes.length) {
    failures.push("Address types contain duplicates.");
  }
  if (new Set(policy.networks).size !== policy.networks.length) {
    failures.push("Networks contain duplicates.");
  }
  if (
    new Set(policy.messageSigningSchemes).size !==
    policy.messageSigningSchemes.length
  ) {
    failures.push("Message signing schemes contain duplicates.");
  }
  const environments = policy.environments.map((environment) =>
    matrixKey(environmentParts(environment)),
  );
  if (new Set(environments).size !== environments.length) {
    failures.push("Environments contain duplicates.");
  }
  if (
    policy.environments.some(
      ({ browser, device }) =>
        browser.name.trim().length === 0 ||
        browser.version.trim().length === 0 ||
        device.os.trim().length === 0,
    )
  ) {
    failures.push("Environment names and versions must not be blank.");
  }
  return failures;
}
