import { describe, expect, it } from "vitest";

import {
  createFeatureRegistry,
  defineFeature,
  type FeatureRegistration,
} from "../src/registry.js";

function registration(
  id: string,
  dependencies: readonly string[] = [],
): FeatureRegistration {
  return {
    manifest: {
      id,
      version: "1.0.0",
      capabilities: ["public-page"],
      dependencies,
    },
    load: async () => ({
      id,
      version: "1.0.0",
      capabilities: ["public-page"],
    }),
  };
}

describe("createFeatureRegistry", () => {
  it("lists, locates, and loads a valid registration", async () => {
    const registry = createFeatureRegistry([registration("catalog")]);
    expect(registry.has("catalog")).toBe(true);
    expect(registry.list()).toHaveLength(1);
    await expect(registry.load("catalog")).resolves.toMatchObject({
      id: "catalog",
    });
  });

  it("rejects duplicate registrations", () => {
    expect(() =>
      createFeatureRegistry([registration("catalog"), registration("catalog")]),
    ).toThrow("Duplicate feature registration");
  });

  it("rejects missing and cyclic dependencies", () => {
    expect(() =>
      createFeatureRegistry([registration("catalog", ["missing"])]),
    ).toThrow("Missing feature dependency");
    expect(() =>
      createFeatureRegistry([
        registration("catalog", ["launches"]),
        registration("launches", ["catalog"]),
      ]),
    ).toThrow("Feature dependency cycle");
  });

  it("rejects an unknown feature load", async () => {
    const registry = createFeatureRegistry([]);
    await expect(registry.load("missing")).rejects.toThrow("not registered");
  });

  it("rejects entrypoint identity and capability drift", async () => {
    const identityDrift = {
      ...registration("catalog"),
      load: async () => ({
        id: "other",
        version: "1.0.0",
        capabilities: ["public-page"] as const,
      }),
    };
    await expect(
      createFeatureRegistry([identityDrift]).load("catalog"),
    ).rejects.toThrow("identity");

    const capabilityDrift = {
      ...registration("catalog"),
      load: async () => ({
        id: "catalog",
        version: "1.0.0",
        capabilities: ["navigation"] as const,
      }),
    };
    await expect(
      createFeatureRegistry([capabilityDrift]).load("catalog"),
    ).rejects.toThrow("capabilities");
  });
});

describe("defineFeature", () => {
  it("rejects a malformed manifest before registration", () => {
    expect(() => defineFeature(registration("INVALID"))).toThrow();
  });
});
