# `@ador/feature-accounts`

Detachable authenticated account, studio, and staff route contributions.

## Public API

`accountsFeature` is the only registration export. Adding or removing it from `configs/features.ts`
adds or removes the complete route family. The lazy entrypoint is validated against its manifest.

## Invariants

- Access requirements are manifest data and are enforced before `render` is called.
- Account and studio require an active platform session.
- Admin additionally requires the configured `platform:operate` capability.
- UI copy never equates authentication with creator approval, publication, or on-chain authority.

## Dependencies and configuration

The feature depends only on plugin contracts, shared identifiers, React, and shared arcade UI. It
does not read cookies, environment variables, databases, or provider SDKs. Access policy is supplied
by the application composition boundary.

## Verification

Run `pnpm --filter @ador/feature-accounts typecheck`, `test:unit`, `test:integration`, and
`test:coverage`. Browser route states are covered by the shared Playwright workspace.
