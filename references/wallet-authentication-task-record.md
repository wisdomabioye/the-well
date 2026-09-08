# Wallet authentication — task record

Status: completed

Baseline: `3812314`
Branch: `feat/database-foundation`
Started: 2026-09-08

## Accepted decisions

- Public identifiers are application-generated UUIDv7 values stored in native PostgreSQL `uuid`
  columns. Domains and providers must not determine identifier shape.
- Wallet authentication follows ADR-005: canonical server-issued challenges, strict BIP-322
  verification, atomic single-use consumption, and revocable PostgreSQL-backed sessions behind an
  auth-owned public contract.
- Authentication frameworks and Bitcoin signature libraries remain boundary adapters. Feature and
  route code must not import their internals; Better Auth is not permitted to own wallet sessions
  while its bearer-token persistence contract conflicts with ADR-005.

## Done means

- Challenge, identity, user, and session persistence has generated migrations and inferred Drizzle
  types.
- Challenges bind the normalized address, network, origin, action, signature scheme, nonce,
  issuance/expiry times, request ID, and schema version in one canonical message.
- Verification rejects malformed, expired, replayed, mismatched, or invalidly signed challenges.
- Challenge consumption and identity/session creation are one concurrency-safe transaction.
- Only cryptographic hashes of canonical challenges and opaque session tokens are persisted.
- The auth package exposes detachable ports and adapters with positive, negative, boundary,
  concurrency, retry, and real-PostgreSQL integration coverage.
- Every repository gate passes and the task diff reaches a deep-review `Converged` verdict.

## Deliberate boundaries

- Roles, organizations, creator admission, and protected page UX belong to the following tasks.
- Legacy message-signing schemes remain disabled unless a separate wallet conformance matrix is
  accepted.
- HTTP rate-limiting integration belongs at the route boundary; this task exposes enough typed
  outcome data for that boundary without inventing deployment policy.

## Failure modes under review

- Two verification requests race for one challenge.
- A valid signature is replayed with another origin, network, address, action, or challenge ID.
- A database failure occurs between identity creation and challenge consumption.
- An existing wallet identity is linked to a second user or recreated under a non-canonical form.
- Session tokens or complete signed challenges leak through durable storage or error responses.

## Resolved implementation gate

The dependency qualification found two incompatible default paths:

- Better Auth `1.6.26` declares Drizzle `^0.45.2` support, while the repository is on
  `1.0.0-rc.4`; using its official Drizzle adapter would be an unsupported combination.
- Better Auth's standard session schema persists the bearer session token, while ADR-005 requires
  persisting only a cryptographic hash.

The approved path is an auth-owned database adapter over the repository's current Drizzle schema.
It hashes session-token lookup values at the adapter boundary and never persists the bearer value.
During implementation, Better Auth's generic adapter contract was proven unsuitable for this
boundary: list/revoke flows expose or reuse its stored `token` field as a bearer credential. Better
Auth may still host other authentication mechanisms later, but wallet sessions use the detachable
auth-owned port so a database hash can never authenticate as a cookie. The user approved the custom
boundary on 2026-09-08; neither the hash-only invariant nor the repository-wide Drizzle version is
weakened.

## Verification and convergence

- Full repository format, environment, lint, policy, typecheck, unit, integration, Rust contract,
  coverage, migration-drift, build, and Playwright gates passed on 2026-09-08.
- Auth coverage: 93.28% statements, 92.68% branches, 100% functions, and 96.72% lines. Merged
  repository line and branch coverage remained above 90%.
- Real-PostgreSQL tests prove atomic rollback, single-use consumption, identity ownership, hashed
  persistence, retry limits, and idle/absolute session expiry. All 36 Playwright cases passed.
- Mutation checks intentionally broke challenge binding, policy limits, signature verification,
  step-up ownership, rollback, expiry boundaries, UUID versioning, action vocabulary, outcome
  mapping, and database constraints; the corresponding tests failed for the intended reasons.
- Deep review converged after three final clean passes: line-by-line data-flow audit, contract/schema
  drift comparison, and adversarial dynamic verification. Earlier findings were repaired and reset
  the streak before these passes.
