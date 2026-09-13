import { describe, expect, it } from "vitest";

import { r2ObjectStorageProvider } from "../src/registration.ts";

describe("R2 provider registration", () => {
  it("loads an entrypoint matching its explicit manifest", async () => {
    await expect(r2ObjectStorageProvider.load()).resolves.toMatchObject({
      capabilities: ["object-storage:s3-compatible"],
      createServices: expect.any(Function),
      id: "r2-object-storage",
      version: "1.0.0",
    });
    expect(r2ObjectStorageProvider.manifest.requiredDecisionGates).toEqual([]);
  });
});
