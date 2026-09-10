import { describe, expect, it } from "vitest";

import {
  featureManifestSchema,
  providerManifestSchema,
} from "../src/features/manifest.js";

const validManifest = {
  id: "platform-shell",
  version: "1.0.0",
  capabilities: ["public-page"],
  dependencies: [],
  requiredDecisionGates: [],
  requiredProviderCapabilities: [],
  pages: [],
  routes: [],
} as const;

describe("featureManifestSchema", () => {
  it("accepts a versioned, capability-bearing manifest", () => {
    expect(featureManifestSchema.parse(validManifest)).toEqual(validManifest);
  });

  it("accepts named dynamic page segments", () => {
    expect(
      featureManifestSchema.parse({
        ...validManifest,
        pages: [{ access: { kind: "public" }, path: "/catalog/[slug]" }],
      }).pages[0]?.path,
    ).toBe("/catalog/[slug]");
  });

  it.each([
    { ...validManifest, id: "Platform Shell" },
    { ...validManifest, version: "latest" },
    { ...validManifest, capabilities: [] },
    { ...validManifest, capabilities: ["public-page", "public-page"] },
    { ...validManifest, requiredDecisionGates: ["release", "release"] },
    {
      ...validManifest,
      requiredProviderCapabilities: ["storage:write", "storage:write"],
    },
    {
      ...validManifest,
      pages: [{ access: { kind: "public" }, path: "catalog" }],
    },
    {
      ...validManifest,
      pages: [{ access: { kind: "public" }, path: "/catalog/" }],
    },
    {
      ...validManifest,
      pages: [{ access: { kind: "public" }, path: "/catalog/[Slug]" }],
    },
    {
      ...validManifest,
      pages: [{ access: { kind: "public" }, path: "/catalog/[slug]/[slug]" }],
    },
    {
      ...validManifest,
      pages: [
        {
          access: { kind: "platform", capability: "invalid" },
          path: "/catalog",
        },
      ],
    },
    {
      ...validManifest,
      routes: [
        {
          method: "GET",
          operationId: "getCatalog",
          path: "/api/v1/catalog//items",
        },
      ],
    },
    {
      ...validManifest,
      routes: [
        {
          method: "GET",
          operationId: "getCatalogItem",
          path: "/api/v1/catalog/:itemId",
        },
      ],
    },
    { ...validManifest, extra: true },
  ])("rejects an invalid manifest", (manifest) => {
    expect(() => featureManifestSchema.parse(manifest)).toThrow();
  });
});

describe("providerManifestSchema", () => {
  it("accepts capability-bearing providers and rejects duplicates", () => {
    const manifest = {
      capabilities: ["storage:write"],
      id: "object-storage",
      requiredDecisionGates: [],
      version: "1.0.0",
    } as const;
    expect(providerManifestSchema.parse(manifest)).toEqual(manifest);
    expect(() =>
      providerManifestSchema.parse({
        ...manifest,
        capabilities: ["storage:write", "storage:write"],
      }),
    ).toThrow();
  });
});
