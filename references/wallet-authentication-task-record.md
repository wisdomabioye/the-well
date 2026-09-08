# Wallet authentication — task record

Status: in progress

Baseline: `e203a99bef55250abed152b5f971484bf321a8b3`
Branch: `feat/database-foundation`
Started: 2026-09-08

## Accepted decisions

- Public identifiers are application-generated UUIDv7 values stored in native PostgreSQL `uuid`
  columns. Domains and providers must not determine identifier shape.
- Wallet authentication follows ADR-005: canonical server-issued challenges, strict BIP-322
  verification, atomic single-use consumption, and revocable PostgreSQL-backed sessions behind an
  auth-owned public contract.
- Better Auth and Bitcoin signature libraries remain boundary adapters. Feature and route code must
  not import their internals.

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

## Active implementation gate

The dependency qualification found two incompatible default paths:

- Better Auth `1.6.26` declares Drizzle `^0.45.2` support, while the repository is on
  `1.0.0-rc.4`; using its official Drizzle adapter would be an unsupported combination.
- Better Auth's standard session schema persists the bearer session token, while ADR-005 requires
  persisting only a cryptographic hash.

The proposed maintainable path is an auth-owned Better Auth database adapter over the repository's
current Drizzle schema. It must hash session-token lookup values at the adapter boundary without
persisting the bearer value. This preserves both accepted invariants but is a material custom
security boundary requiring full Better Auth adapter conformance tests. Work is paused for explicit
approval of that boundary rather than silently weakening the ADR or changing the repository-wide
Drizzle version.
