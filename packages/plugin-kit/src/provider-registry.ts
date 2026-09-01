import {
  providerManifestSchema,
  type ProviderId,
  type ProviderManifest,
} from "@ador/shared/providers";
import type { ProviderCapability } from "@ador/shared/features";

export interface ProviderEntrypoint {
  readonly capabilities: readonly ProviderCapability[];
  readonly id: ProviderId;
  readonly version: string;
}

export interface ProviderRegistration {
  readonly load: () => Promise<ProviderEntrypoint>;
  readonly manifest: ProviderManifest;
}

export interface ProviderRegistry {
  hasCapability(capability: ProviderCapability): boolean;
  list(): readonly ProviderManifest[];
  load(id: ProviderId): Promise<ProviderEntrypoint>;
}

function freezeManifest(manifest: ProviderManifest): ProviderManifest {
  return Object.freeze({
    ...manifest,
    capabilities: Object.freeze([...manifest.capabilities]),
  });
}

function capabilityKey(values: readonly ProviderCapability[]): string {
  return [...values].sort().join("\n");
}

export function defineProvider(
  registration: ProviderRegistration,
): ProviderRegistration {
  return {
    ...registration,
    manifest: freezeManifest(
      providerManifestSchema.parse(registration.manifest),
    ),
  };
}

export function createProviderRegistry(
  definitions: readonly ProviderRegistration[],
): ProviderRegistry {
  const registrations = new Map<ProviderId, ProviderRegistration>();
  const capabilities = new Set<ProviderCapability>();

  for (const definition of definitions) {
    const registration = defineProvider(definition);
    if (registrations.has(registration.manifest.id)) {
      throw new Error(
        `Duplicate provider registration: ${registration.manifest.id}.`,
      );
    }
    registrations.set(registration.manifest.id, registration);
    registration.manifest.capabilities.forEach((capability) =>
      capabilities.add(capability),
    );
  }

  return {
    hasCapability: (capability) => capabilities.has(capability),
    list: () => [...registrations.values()].map(({ manifest }) => manifest),
    load: async (id) => {
      const registration = registrations.get(id);
      if (!registration) throw new Error(`Provider is not registered: ${id}.`);

      const entrypoint = await registration.load();
      if (
        entrypoint.id !== registration.manifest.id ||
        entrypoint.version !== registration.manifest.version
      ) {
        throw new Error(
          "Loaded provider identity does not match its manifest.",
        );
      }
      if (
        capabilityKey(entrypoint.capabilities) !==
        capabilityKey(registration.manifest.capabilities)
      ) {
        throw new Error(
          "Loaded provider capabilities do not match its manifest.",
        );
      }
      return entrypoint;
    },
  };
}
