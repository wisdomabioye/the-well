import { describe, expect, it } from "vitest";

import { createFeatureRegistry } from "../src/registry.js";

describe("feature module loading", () => {
  it("loads an explicitly registered module boundary", async () => {
    const registry = createFeatureRegistry([
      {
        manifest: {
          id: "fixture",
          version: "1.0.0",
          capabilities: ["public-page"],
          dependencies: [],
          requiredDecisionGates: [],
          requiredProviderCapabilities: [],
          routes: [],
        },
        load: async () =>
          import("./fixtures/feature.js").then(
            ({ fixtureEntrypoint }) => fixtureEntrypoint,
          ),
      },
    ]);

    await expect(registry.load("fixture")).resolves.toMatchObject({
      id: "fixture",
    });
  });
});
