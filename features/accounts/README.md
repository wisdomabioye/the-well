# `@ador/feature-accounts`

Detachable authenticated account, studio, and staff route contributions.

## Public API

`accountsFeature` is the only registration export. Adding or removing it from `configs/features.ts`
adds or removes the complete page and passkey API route family. The lazy entrypoint is validated
against its manifest.

## Invariants

- Access requirements are manifest data and are enforced before `render` is called.
- Account and studio require an active platform session.
- Admin additionally requires the configured `platform:operate` capability.
- UI copy never equates authentication with creator approval, publication, or on-chain authority.
- Passkey linking requires the exact recent session, and successful link/unlink responses rotate
  the host-only platform cookie without placing its bearer token in JSON.

## Dependencies and configuration

The feature owns its replaceable SimpleWebAuthn browser adapter and composes the auth repository at
its server-only runtime boundary. Domain logic remains in `@ador/auth`; validated application URL,
name, session, and ceremony durations are mapped into its provider-neutral policy. Cookie handling
remains in the Next adapter so the feature can move to another HTTP host without changing domain
logic.

## Verification

Run `pnpm --filter @ador/feature-accounts typecheck`, `test:unit`, `test:integration`, and
`test:coverage`. Browser route states are covered by the shared Playwright workspace.
