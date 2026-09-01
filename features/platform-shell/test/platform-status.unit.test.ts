import { describe, expect, it } from "vitest";

import { createPlatformStatusOperation } from "../src/application/platform-status.js";

describe("platform status operation", () => {
  it("reports only implemented foundation state", async () => {
    const operation = createPlatformStatusOperation(2);
    await expect(
      operation.execute(
        {},
        {
          correlationId: "123e4567-e89b-42d3-a456-426614174000",
        },
      ),
    ).resolves.toEqual({
      ok: true,
      value: {
        apiVersion: "v1",
        registeredFeatures: 2,
        stage: "foundation",
        transactionalActions: "gated",
      },
    });
  });
});
