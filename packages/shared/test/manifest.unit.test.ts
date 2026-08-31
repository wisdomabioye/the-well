import { describe, expect, it } from "vitest";

import { featureManifestSchema } from "../src/features/manifest.js";

const validManifest = {
  id: "platform-shell",
  version: "1.0.0",
  capabilities: ["public-page"],
  dependencies: [],
} as const;

describe("featureManifestSchema", () => {
  it("accepts a versioned, capability-bearing manifest", () => {
    expect(featureManifestSchema.parse(validManifest)).toEqual(validManifest);
  });

  it.each([
    { ...validManifest, id: "Platform Shell" },
    { ...validManifest, version: "latest" },
    { ...validManifest, capabilities: [] },
    { ...validManifest, extra: true },
  ])("rejects an invalid manifest", (manifest) => {
    expect(() => featureManifestSchema.parse(manifest)).toThrow();
  });
});
