# `@ador/feature-platform-shell`

The first registered platform feature. It owns the public shell capabilities currently rendered
by the web application: primary navigation and the public landing page.

## Public API

The package exports `platformShellFeature`, a validated registration consumed by
`configs/features.ts`. Its entrypoint is lazy-loaded through `@ador/plugin-kit`.

## Dependencies and configuration

It depends only on the shared feature contract and plugin kit. It owns no environment variables,
database state, provider adapter, or product policy.

## Invariants

- The manifest and loaded entrypoint have the same ID, version, and capabilities.
- Declared capabilities represent implemented behavior; unfinished launch actions remain gated.

## Verification

Run `pnpm --filter @ador/feature-platform-shell typecheck`, `test:unit`, `test:integration`, or
`test:coverage`. Platform engineering owns this foundation feature.
