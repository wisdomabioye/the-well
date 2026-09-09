import { describe, expect, it } from "vitest";

import { registerHttpOperation } from "@ador/http/registered-operation";
import {
  platformStatusInputSchema,
  platformStatusSchema,
} from "@ador/shared/platform";

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
      requiredDecisionGates: [],
      requiredProviderCapabilities: [],
      pages: [],
      routes: [],
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

  it("does not expose mutable internal manifests", () => {
    const registry = createFeatureRegistry([registration("catalog")]);
    const [manifest] = registry.list();

    expect(manifest && Reflect.set(manifest, "id", "changed")).toBe(false);
    expect(
      manifest && Reflect.set(manifest.requiredDecisionGates, "0", "release"),
    ).toBe(false);
    expect(registry.list()[0]?.id).toBe("catalog");
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

  it("resolves only registered pages and rejects contribution drift", async () => {
    const detachable: FeatureRegistration = {
      ...registration("catalog"),
      manifest: {
        ...registration("catalog").manifest,
        pages: [{ access: { kind: "public" }, path: "/catalog" }],
      },
      load: async () => ({
        capabilities: ["public-page"],
        id: "catalog",
        pages: [
          {
            access: { kind: "public" },
            path: "/catalog",
            render: () => "catalog",
          },
        ],
        version: "1.0.0",
      }),
    };
    const registry = createFeatureRegistry([detachable]);

    await expect(registry.resolvePage("/catalog")).resolves.toMatchObject({
      path: "/catalog",
    });
    await expect(
      createFeatureRegistry([]).resolvePage("/catalog"),
    ).resolves.toBeUndefined();

    const routeDrift: FeatureRegistration = {
      ...registration("catalog"),
      manifest: {
        ...registration("catalog").manifest,
        routes: [
          { method: "GET", operationId: "getCatalog", path: "/api/v1/catalog" },
        ],
      },
    };
    await expect(
      createFeatureRegistry([routeDrift]).load("catalog"),
    ).rejects.toThrow("routes");

    const operationIdDrift: FeatureRegistration = {
      ...registration("catalog"),
      manifest: {
        ...registration("catalog").manifest,
        routes: [
          { method: "GET", operationId: "getCatalog", path: "/api/v1/catalog" },
        ],
      },
      load: async () => ({
        capabilities: ["public-page"],
        id: "catalog",
        operations: [
          registerHttpOperation({
            applicationErrors: [],
            execute: async () => ({
              ok: true,
              value: {
                apiVersion: "v1",
                registeredFeatures: 1,
                stage: "foundation",
                transactionalActions: "gated",
              },
            }),
            idempotency: "none",
            input: "none",
            inputSchema: platformStatusInputSchema,
            method: "GET",
            operationId: "getDifferentCatalog",
            outputSchema: platformStatusSchema,
            path: "/api/v1/catalog",
          }),
        ],
        version: "1.0.0",
      }),
    };
    await expect(
      createFeatureRegistry([operationIdDrift]).load("catalog"),
    ).rejects.toThrow("routes");

    const pageDrift = {
      ...registration("catalog"),
      load: async () => ({
        capabilities: ["public-page"] as const,
        id: "catalog",
        pages: [
          {
            access: { kind: "public" as const },
            path: "/catalog" as const,
            render: () => "catalog",
          },
        ],
        version: "1.0.0",
      }),
    };
    await expect(
      createFeatureRegistry([pageDrift]).load("catalog"),
    ).rejects.toThrow("pages");
  });
});

describe("defineFeature", () => {
  it("rejects a malformed manifest before registration", () => {
    expect(() => defineFeature(registration("INVALID"))).toThrow();
  });
});
