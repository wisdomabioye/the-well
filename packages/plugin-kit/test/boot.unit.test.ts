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
      pages: [],
      requiredDecisionGates: [],
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

const decisionCatalog = { decisions: [], gates: [], version: 1 } as const;

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
          requiredDecisionGates: [],
          version: "1.0.0",
        },
      },
    ]);

    const boot = validatePlatformBoot({
      decisionCatalog,
      featureRegistry,
      providerRegistry,
    });
    expect(boot.providerCount).toBe(1);
    expect(boot.features.map(({ id }) => id)).toEqual(["catalog"]);
    expect(Reflect.set(boot.features, "0", {})).toBe(false);
  });

  it("rejects a missing provider capability", () => {
    expect(() =>
      validatePlatformBoot({
        decisionCatalog,
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
        decisionCatalog,
        featureRegistry: createFeatureRegistry([registration]),
        providerRegistry: createProviderRegistry([]),
      }),
    ).toThrow("without the api-routes capability");
  });

  it("rejects duplicate method and path pairs", () => {
    expect(() =>
      validatePlatformBoot({
        decisionCatalog,
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
        decisionCatalog,
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

  it("rejects a feature route shadowed by platform infrastructure", () => {
    expect(() =>
      validatePlatformBoot({
        decisionCatalog,
        featureRegistry: createFeatureRegistry([
          feature("catalog", {
            method: "GET",
            operationId: "featureOpenApi",
            path: "/api/v1/openapi",
          }),
        ]),
        providerRegistry: createProviderRegistry([]),
        reservedRoutes: [
          {
            method: "GET",
            operationId: "getOpenApiDocument",
            path: "/api/v1/openapi",
          },
        ],
      }),
    ).toThrow(
      "Route collision for GET /api/v1/openapi: platform infrastructure and catalog",
    );
  });

  it("rejects duplicate dynamic page ownership at boot", () => {
    const first = feature("catalog", catalogRoute);
    const second = feature("launches", {
      method: "GET",
      operationId: "getLaunches",
      path: "/api/v1/launches",
    });
    expect(() =>
      validatePlatformBoot({
        decisionCatalog,
        featureRegistry: createFeatureRegistry([
          {
            ...first,
            manifest: {
              ...first.manifest,
              capabilities: ["api-routes", "public-page"],
              pages: [{ access: { kind: "public" }, path: "/[group]/edit" }],
            },
          },
          {
            ...second,
            manifest: {
              ...second.manifest,
              capabilities: ["api-routes", "public-page"],
              pages: [{ access: { kind: "public" }, path: "/admin/[action]" }],
            },
          },
        ]),
        providerRegistry: createProviderRegistry([]),
      }),
    ).toThrow("Page collision between /[group]/edit and /admin/[action]");
  });

  it("rejects page contributions without the matching capability", () => {
    const registration = feature("catalog", catalogRoute);
    expect(() =>
      validatePlatformBoot({
        decisionCatalog,
        featureRegistry: createFeatureRegistry([
          {
            ...registration,
            manifest: {
              ...registration.manifest,
              pages: [{ access: { kind: "public" }, path: "/browse" }],
            },
          },
        ]),
        providerRegistry: createProviderRegistry([]),
      }),
    ).toThrow("without the public-page capability");
  });

  it("requires authenticated-page capability for protected pages", () => {
    const registration = feature("catalog", catalogRoute);
    expect(() =>
      validatePlatformBoot({
        decisionCatalog,
        featureRegistry: createFeatureRegistry([
          {
            ...registration,
            manifest: {
              ...registration.manifest,
              capabilities: ["api-routes", "public-page"],
              pages: [{ access: { kind: "authenticated" }, path: "/account" }],
            },
          },
        ]),
        providerRegistry: createProviderRegistry([]),
      }),
    ).toThrow("without the authenticated-page capability");
  });

  const gatedCatalog = {
    decisions: [
      {
        deadline: "Week 1 exit",
        id: "D15",
        owner: "product + engineering",
        requiredFields: ["claimant_binding"],
        status: "researching",
      },
    ],
    gates: [{ id: "phase-zero-exit", requiredDecisions: ["D15"] }],
    version: 1,
  } as const;

  it("rejects a gated feature until every decision is accepted", () => {
    const baseFeature = feature("catalog", catalogRoute);
    const featureRegistration = {
      ...baseFeature,
      manifest: {
        ...baseFeature.manifest,
        requiredDecisionGates: ["phase-zero-exit"] as const,
      },
    };

    expect(() =>
      validatePlatformBoot({
        decisionCatalog: gatedCatalog,
        featureRegistry: createFeatureRegistry([featureRegistration]),
        providerRegistry: createProviderRegistry([]),
      }),
    ).toThrow("phase-zero-exit is closed by: D15");
  });

  it("rejects a gated provider until every decision is accepted", () => {
    const providerRegistry = createProviderRegistry([
      {
        load: async () => ({
          capabilities: ["indexer:read"],
          id: "indexer",
          version: "1.0.0",
        }),
        manifest: {
          capabilities: ["indexer:read"],
          id: "indexer",
          requiredDecisionGates: ["phase-zero-exit"],
          version: "1.0.0",
        },
      },
    ]);
    expect(() =>
      validatePlatformBoot({
        decisionCatalog: gatedCatalog,
        featureRegistry: createFeatureRegistry([]),
        providerRegistry,
      }),
    ).toThrow("phase-zero-exit is closed by: D15");
  });
});
