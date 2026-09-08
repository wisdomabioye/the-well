import { describe, expect, it } from "vitest";

import { createSessionService } from "../src/application/session-service.ts";

describe("session service policy", () => {
  it("rejects a non-positive idle lifetime", () => {
    expect(() =>
      createSessionService({
        clock: () => new Date(),
        idleLifetimeMs: 0,
        repository: {
          findAndRenew: async () => null,
          revoke: async () => false,
        },
      }),
    ).toThrow("Session idle lifetime is invalid");
  });
});
