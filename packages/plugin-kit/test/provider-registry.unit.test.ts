import { describe, expect, it } from "vitest";

import {
  createProviderRegistry,
  defineProvider,
  type ProviderRegistration,
} from "../src/provider-registry.js";

function registration(id: string): ProviderRegistration {
  return {
    load: async () => ({
      capabilities: ["system:status"],
      id,
      version: "1.0.0",
    }),
    manifest: {
      capabilities: ["system:status"],
      id,
      version: "1.0.0",
    },
  };
}

describe("createProviderRegistry", () => {
  it("lists and locates explicit provider capabilities", () => {
    const registry = createProviderRegistry([registration("foundation")]);
    expect(registry.list()).toHaveLength(1);
    expect(registry.hasCapability("system:status")).toBe(true);
    expect(registry.hasCapability("storage:write")).toBe(false);
  });

  it("does not expose a mutable provider manifest", () => {
    const registry = createProviderRegistry([registration("foundation")]);
    const [manifest] = registry.list();
    expect(manifest && Reflect.set(manifest, "id", "changed")).toBe(false);
    expect(
      manifest && Reflect.set(manifest.capabilities, "0", "storage:write"),
    ).toBe(false);
  });

  it("rejects duplicate and malformed registrations", () => {
    expect(() =>
      createProviderRegistry([
        registration("foundation"),
        registration("foundation"),
      ]),
    ).toThrow("Duplicate provider registration");
    expect(() => defineProvider(registration("INVALID"))).toThrow();
  });

  it("rejects an unknown provider load", async () => {
    await expect(createProviderRegistry([]).load("missing")).rejects.toThrow(
      "not registered",
    );
  });

  it("rejects loaded identity and capability drift", async () => {
    const identityDrift = {
      ...registration("foundation"),
      load: async () => ({
        capabilities: ["system:status"] as const,
        id: "other",
        version: "1.0.0",
      }),
    };
    await expect(
      createProviderRegistry([identityDrift]).load("foundation"),
    ).rejects.toThrow("identity");

    const capabilityDrift = {
      ...registration("foundation"),
      load: async () => ({
        capabilities: ["storage:write"] as const,
        id: "foundation",
        version: "1.0.0",
      }),
    };
    await expect(
      createProviderRegistry([capabilityDrift]).load("foundation"),
    ).rejects.toThrow("capabilities");
  });
});
