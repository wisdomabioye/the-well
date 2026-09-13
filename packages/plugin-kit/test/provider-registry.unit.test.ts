import { describe, expect, it } from "vitest";

import {
  createProviderRegistry,
  defineProvider,
  type ProviderRegistration,
} from "../src/provider-registry.js";

declare module "../src/provider-registry.js" {
  interface ProviderServices {
    readonly "system:status": { readonly read: () => string };
  }
}

const statusService = { read: () => "ready" };

function registration(id: string): ProviderRegistration {
  return {
    load: async () => ({
      capabilities: ["system:status"],
      createServices: () => ({ "system:status": statusService }),
      id,
      version: "1.0.0",
    }),
    manifest: {
      capabilities: ["system:status"],
      id,
      requiredDecisionGates: [],
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
    expect(
      manifest && Reflect.set(manifest.requiredDecisionGates, "0", "release"),
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
    expect(() =>
      createProviderRegistry([
        registration("foundation"),
        registration("other"),
      ]),
    ).toThrow("owned by both");
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

  it("resolves the typed service for the selected capability", async () => {
    let creations = 0;
    let loads = 0;
    const selected = registration("foundation");
    const registry = createProviderRegistry([
      {
        ...selected,
        load: async () => {
          loads += 1;
          const entrypoint = await selected.load();
          return {
            ...entrypoint,
            createServices: () => {
              creations += 1;
              return { "system:status": statusService };
            },
          };
        },
      },
    ]);
    await expect(
      Promise.all([
        registry.resolve("system:status"),
        registry.resolve("system:status"),
      ]),
    ).resolves.toEqual([statusService, statusService]);
    await expect(registry.resolve("system:status")).resolves.toBe(
      statusService,
    );
    expect({ creations, loads }).toEqual({ creations: 1, loads: 1 });
  });

  it("rejects missing, absent, and undeclared runtime services", async () => {
    await expect(
      createProviderRegistry([]).resolve("system:status"),
    ).rejects.toThrow("not registered");

    const missing = {
      ...registration("foundation"),
      load: async () => ({
        capabilities: ["system:status"] as const,
        id: "foundation",
        version: "1.0.0",
      }),
    };
    await expect(
      createProviderRegistry([missing]).resolve("system:status"),
    ).rejects.toThrow("did not create runtime services");

    const absent = {
      ...registration("foundation"),
      load: async () => ({
        capabilities: ["system:status"] as const,
        createServices: () => ({}),
        id: "foundation",
        version: "1.0.0",
      }),
    };
    await expect(
      createProviderRegistry([absent]).resolve("system:status"),
    ).rejects.toThrow("did not create service");

    const services = {
      "other:service": statusService,
      "system:status": statusService,
    };
    const undeclared = {
      ...registration("foundation"),
      load: async () => ({
        capabilities: ["system:status"] as const,
        createServices: () => services,
        id: "foundation",
        version: "1.0.0",
      }),
    };
    await expect(
      createProviderRegistry([undeclared]).resolve("system:status"),
    ).rejects.toThrow("undeclared service");
  });
});
