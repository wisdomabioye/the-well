# `@ador/shared`

Runtime-neutral contracts and pure domain behavior shared by browser and server runtimes.

## Public API

- `@ador/shared/features` — versioned feature identifiers, capabilities, and manifest schema.

## Boundaries

This package may use runtime schemas and pure TypeScript. It must not import React, Next.js,
database clients, provider SDKs, Node-only APIs, browser globals, secrets, or feature internals.
New exports belong to a named domain subpath; there is no catch-all utilities module.

## Invariants

- Feature IDs are lowercase kebab-case.
- Feature versions use an explicit three-part semantic version.
- Every feature declares at least one supported capability.
- Manifests reject undeclared fields.

## Verification

Run `pnpm --filter @ador/shared typecheck`, `test:unit`, `test:integration`, or `test:coverage`.
The platform engineering owner maintains this package.
