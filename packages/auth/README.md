# `@ador/auth`

Detachable, server-only Bitcoin wallet authentication and session lifecycle logic.

## Public API

- `createWalletAuthService` issues canonical BIP-322 challenges and verifies them through injected
  repository and verifier ports.
- `createDrizzleWalletAuthRepository` persists challenges and atomically consumes them while
  creating or resolving the wallet identity, user, and session.
- `createSessionService` resolves, renews, and revokes opaque sessions through an injected port.
- `createDrizzleSessionRepository` stores only SHA-256 token hashes and enforces idle, absolute,
  and revocation predicates in PostgreSQL.
- `strictBip322Verifier` contains the `bip322-js` boundary.

Callers compose these exports explicitly. Removing wallet authentication requires removing its
registration and route adapter; no feature discovery or global registration is used.

## Invariants

- Challenges bind the canonical address, script identity, network, origin, URI, domain, action,
  request ID, nonce, timestamps, signature scheme, and schema version.
- Only the canonical message hash is stored. The signature and full message are not persisted.
- A challenge is consumed once inside a row-locked transaction. An advisory transaction lock
  serializes first use of the same script identity across different challenges.
- Session bearer tokens contain 256 random bits and exist only in the successful response. Only
  their SHA-256 hashes reach storage.
- Session lookup requires both idle and absolute expiry to be in the future and renews idle expiry
  no later than the absolute limit. Revocation is idempotent.
- Wallet-first users receive a reserved `.invalid` internal email and it is never marked verified.
- Better Auth must not own wallet sessions unless a future adapter proves that stored hashes can
  never be accepted as bearer credentials in lookup, listing, or revocation flows.

## Configuration

All durations and attempt limits are supplied through `WalletAuthPolicy`; no environment or
provider value is read inside this package. The route composition layer owns validated environment
mapping and allowed-origin policy.

## Verification

Docker is required for integration and coverage commands because they apply the real migrations to
an isolated PostgreSQL 18 container.

```bash
pnpm --filter @ador/auth typecheck
pnpm --filter @ador/auth lint
pnpm --filter @ador/auth test:unit
pnpm --filter @ador/auth test:integration
pnpm --filter @ador/auth test:coverage
```
