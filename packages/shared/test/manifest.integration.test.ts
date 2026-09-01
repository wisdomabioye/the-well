import { describe, expect, it } from "vitest";

import { featureManifestSchema } from "../src/features/manifest.js";

describe("feature manifest serialization", () => {
  it("round-trips through JSON without changing its contract", () => {
    const serialized = JSON.stringify({
      id: "games",
      version: "2.1.0",
      capabilities: ["public-page", "navigation"],
      dependencies: ["platform-shell"],
      requiredProviderCapabilities: [],
      routes: [],
    });

    const result = featureManifestSchema.parse(JSON.parse(serialized));
    expect(JSON.stringify(result)).toBe(serialized);
  });
});
