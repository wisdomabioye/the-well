import { describe, expect, it } from "vitest";

import { createWalletAuthService } from "../src/application/service.ts";

const repository = {
  consumeChallenge: async () => ({ kind: "unavailable" as const }),
  findChallenge: async () => null,
  incrementFailedAttempt: async () => undefined,
  issueChallenge: async () => undefined,
};

const verifier = { verify: () => false };

describe("wallet authentication policy", () => {
  it.each([
    {
      challengeLifetimeMs: 0,
      maximumVerificationAttempts: 1,
      sessionAbsoluteLifetimeMs: 2,
      sessionIdleLifetimeMs: 1,
    },
    {
      challengeLifetimeMs: 1,
      maximumVerificationAttempts: 0,
      sessionAbsoluteLifetimeMs: 2,
      sessionIdleLifetimeMs: 1,
    },
    {
      challengeLifetimeMs: 1,
      maximumVerificationAttempts: 1,
      sessionAbsoluteLifetimeMs: 2,
      sessionIdleLifetimeMs: 0,
    },
    {
      challengeLifetimeMs: 1,
      maximumVerificationAttempts: 1,
      sessionAbsoluteLifetimeMs: 1,
      sessionIdleLifetimeMs: 2,
    },
  ])("rejects an invalid policy", (policy) => {
    expect(() =>
      createWalletAuthService({
        clock: () => new Date(),
        policy,
        repository,
        verifier,
      }),
    ).toThrow("Wallet authentication policy is invalid");
  });
});
