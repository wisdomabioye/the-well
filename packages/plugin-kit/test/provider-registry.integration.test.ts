import { describe, expect, it } from "vitest";

import { createProviderRegistry } from "../src/provider-registry.js";

describe("provider module loading", () => {
  it("loads an explicitly registered provider boundary", async () => {
    const registry = createProviderRegistry([
      {
        load: async () =>
          import("./fixtures/provider.js").then(
            ({ fixtureProviderEntrypoint }) => fixtureProviderEntrypoint,
          ),
        manifest: {
          capabilities: ["system:status"],
          id: "fixture-provider",
          requiredDecisionGates: [],
          version: "1.0.0",
        },
      },
    ]);

    await expect(registry.load("fixture-provider")).resolves.toMatchObject({
      id: "fixture-provider",
    });
  });
});
