import { describe, expect, it } from "vitest";

import { validatePlatformBoot } from "../src/boot.js";
import {
  createFeatureRegistry,
  type FeatureRegistration,
} from "../src/registry.js";
import { createProviderRegistry } from "../src/provider-registry.js";

function feature(
  id: string,
  route: {
    readonly method: "GET" | "POST";
    readonly operationId: string;
    readonly path: string;
  },
  requiredProviderCapabilities: readonly string[] = [],
): FeatureRegistration {
  return {
    load: async () => ({
      capabilities: ["api-routes"],
      id,
      version: "1.0.0",
    }),
    manifest: {
      capabilities: ["api-routes"],
      dependencies: [],
      id,
      requiredProviderCapabilities,
      routes: [route],
      version: "1.0.0",
    },
  };
}

const catalogRoute = {
  method: "GET",
  operationId: "getCatalog",
  path: "/api/v1/catalog",
} as const;

describe("validatePlatformBoot", () => {
  it("returns an immutable manifest when all requirements are satisfied", () => {
    const featureRegistry = createFeatureRegistry([
      feature("catalog", catalogRoute, ["indexer:read"]),
    ]);
    const providerRegistry = createProviderRegistry([
      {
        load: async () => ({
          capabilities: ["indexer:read"],
          id: "local-indexer",
          version: "1.0.0",
        }),
        manifest: {
          capabilities: ["indexer:read"],
          id: "local-indexer",
          version: "1.0.0",
        },
      },
    ]);

    const boot = validatePlatformBoot({ featureRegistry, providerRegistry });
    expect(boot.providerCount).toBe(1);
    expect(boot.features.map(({ id }) => id)).toEqual(["catalog"]);
    expect(Reflect.set(boot.features, "0", {})).toBe(false);
  });

  it("rejects a missing provider capability", () => {
    expect(() =>
      validatePlatformBoot({
        featureRegistry: createFeatureRegistry([
          feature("catalog", catalogRoute, ["indexer:read"]),
        ]),
        providerRegistry: createProviderRegistry([]),
      }),
    ).toThrow("missing provider capability: indexer:read");
  });

  it("rejects route contributions without the matching feature capability", () => {
    const validRegistration = feature("catalog", catalogRoute);
    const registration = {
      ...validRegistration,
      manifest: {
        ...validRegistration.manifest,
        capabilities: ["public-page"] as const,
      },
    };
    expect(() =>
      validatePlatformBoot({
        featureRegistry: createFeatureRegistry([registration]),
        providerRegistry: createProviderRegistry([]),
      }),
    ).toThrow("without the api-routes capability");
  });

  it("rejects duplicate method and path pairs", () => {
    expect(() =>
      validatePlatformBoot({
        featureRegistry: createFeatureRegistry([
          feature("catalog", catalogRoute),
          feature("launches", {
            ...catalogRoute,
            operationId: "getLaunches",
          }),
        ]),
        providerRegistry: createProviderRegistry([]),
      }),
    ).toThrow("Route collision for GET /api/v1/catalog");
  });

  it("rejects duplicate operation IDs across different routes", () => {
    expect(() =>
      validatePlatformBoot({
        featureRegistry: createFeatureRegistry([
          feature("catalog", catalogRoute),
          feature("launches", {
            ...catalogRoute,
            path: "/api/v1/launches",
          }),
        ]),
        providerRegistry: createProviderRegistry([]),
      }),
    ).toThrow("Operation ID collision for getCatalog");
  });

  it("treats differently named dynamic segments as the same route", () => {
    expect(() =>
      validatePlatformBoot({
        featureRegistry: createFeatureRegistry([
          feature("catalog", {
            ...catalogRoute,
            path: "/api/v1/catalog/:itemId",
          }),
          feature("launches", {
            method: "GET",
            operationId: "getLaunch",
            path: "/api/v1/catalog/:slug",
          }),
        ]),
        providerRegistry: createProviderRegistry([]),
      }),
    ).toThrow("Route collision for GET /api/v1/catalog/:parameter");
  });
});
