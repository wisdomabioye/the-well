import {
  featureManifestSchema,
  type FeatureCapability,
  type FeatureId,
  type FeatureManifest,
} from "@ador/shared/features";

export interface FeatureEntrypoint {
  readonly capabilities: readonly FeatureCapability[];
  readonly id: FeatureId;
  readonly version: string;
}

export interface FeatureRegistration {
  readonly load: () => Promise<FeatureEntrypoint>;
  readonly manifest: FeatureManifest;
}

export interface FeatureRegistry {
  has(id: FeatureId): boolean;
  list(): readonly FeatureManifest[];
  load(id: FeatureId): Promise<FeatureEntrypoint>;
}

function freezeManifest(manifest: FeatureManifest): FeatureManifest {
  return Object.freeze({
    ...manifest,
    capabilities: Object.freeze([...manifest.capabilities]),
    dependencies: Object.freeze([...manifest.dependencies]),
    requiredProviderCapabilities: Object.freeze([
      ...manifest.requiredProviderCapabilities,
    ]),
    routes: Object.freeze(
      manifest.routes.map((route) => Object.freeze({ ...route })),
    ),
  });
}

function assertSameCapabilities(
  expected: readonly FeatureCapability[],
  actual: readonly FeatureCapability[],
): void {
  const normalize = (values: readonly FeatureCapability[]) =>
    [...values].sort().join("\n");

  if (normalize(expected) !== normalize(actual)) {
    throw new Error("Loaded feature capabilities do not match its manifest.");
  }
}

function assertDependencyGraph(
  registrations: ReadonlyMap<FeatureId, FeatureRegistration>,
): void {
  const complete = new Set<FeatureId>();
  const active = new Set<FeatureId>();

  const visit = (id: FeatureId): void => {
    if (complete.has(id)) return;
    if (active.has(id))
      throw new Error(`Feature dependency cycle includes ${id}.`);

    const registration = registrations.get(id);
    if (!registration) throw new Error(`Missing feature dependency: ${id}.`);

    active.add(id);
    registration.manifest.dependencies.forEach(visit);
    active.delete(id);
    complete.add(id);
  };

  registrations.forEach(({ manifest }) => visit(manifest.id));
}

export function defineFeature(
  registration: FeatureRegistration,
): FeatureRegistration {
  return {
    ...registration,
    manifest: freezeManifest(
      featureManifestSchema.parse(registration.manifest),
    ),
  };
}

export function createFeatureRegistry(
  definitions: readonly FeatureRegistration[],
): FeatureRegistry {
  const registrations = new Map<FeatureId, FeatureRegistration>();

  for (const definition of definitions) {
    const registration = defineFeature(definition);
    if (registrations.has(registration.manifest.id)) {
      throw new Error(
        `Duplicate feature registration: ${registration.manifest.id}.`,
      );
    }
    registrations.set(registration.manifest.id, registration);
  }

  assertDependencyGraph(registrations);

  return {
    has: (id) => registrations.has(id),
    list: () => [...registrations.values()].map(({ manifest }) => manifest),
    load: async (id) => {
      const registration = registrations.get(id);
      if (!registration) throw new Error(`Feature is not registered: ${id}.`);

      const entrypoint = await registration.load();
      if (
        entrypoint.id !== registration.manifest.id ||
        entrypoint.version !== registration.manifest.version
      ) {
        throw new Error("Loaded feature identity does not match its manifest.");
      }
      assertSameCapabilities(
        registration.manifest.capabilities,
        entrypoint.capabilities,
      );
      return entrypoint;
    },
  };
}
