# `@ador/plugin-kit`

Explicit feature registration, validation, dependency checking, and lazy module loading.

## Public API

- `defineFeature(registration)` validates one manifest at its declaration boundary.
- `createFeatureRegistry(registrations)` creates an immutable public registry interface.
- `FeatureRegistration` and `FeatureEntrypoint` define the plugin boundary.

Applications register a feature by importing its registration and adding it to
`configs/features.ts`. The registry never scans the filesystem or activates modules through import
side effects.

## Invariants

- IDs are unique.
- Every dependency exists and dependency graphs are acyclic.
- A loaded entrypoint must match its manifest identity, version, and capabilities.
- Loading is explicit and lazy.

## Verification

Run `pnpm --filter @ador/plugin-kit typecheck`, `test:unit`, `test:integration`, or
`test:coverage`. Platform engineering owns the registry contract.
