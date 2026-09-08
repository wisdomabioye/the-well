# `@ador/feature-platform-shell`

The first registered platform feature. It owns the public shell capabilities currently rendered
by the web application: primary navigation and the public landing page.

Its manifest declares its page and operation contributions, while the lazy entrypoint supplies
their implementations. The delivery app knows only the plugin-kit contracts.

## Public API

The package exports `platformShellFeature`, a validated registration consumed by
`configs/features.ts`. Its entrypoint is lazy-loaded through `@ador/plugin-kit`. The
`@ador/feature-platform-shell/status` subpath exposes the framework-neutral `/api/v1/platform`
operation.

Register or detach the complete feature through the single entry in `configs/features.ts`.

## Dependencies and configuration

It depends on shared contracts, the HTTP operation boundary, and plugin kit. It owns no environment
variables, database state, provider adapter, or product policy. Fastify is test-only evidence for
the accepted extraction target.

## Invariants

- The manifest and loaded entrypoint have the same ID, version, and capabilities.
- Declared capabilities represent implemented behavior; unfinished launch actions remain gated.
- Platform status reports only the foundation stage and gated transactional state.

## Verification

Run `pnpm --filter @ador/feature-platform-shell typecheck`, `test:unit`, `test:integration`, or
`test:coverage`. Platform engineering owns this foundation feature.
