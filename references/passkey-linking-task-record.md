# Authenticated passkey linking — task record

Status: completed  
Task: `W2-09`  
Baseline: `7d1629110c9535f6e5f04d8942856c5d396cd863`

## Accepted adapter decision

Use exact-pinned `@simplewebauthn/server` 14.0.1 and `@simplewebauthn/browser` 14.0.0 behind
platform-owned ports. npm metadata reports MIT licensing, Node 20+ compatibility for the server,
no deprecation marker, and these versions as the current latest releases on 2026-09-10.

## Done criteria

- Registration begins only for a recently authenticated user and binds the challenge to the exact
  session, relying-party ID, origin, user, ceremony, and expiry.
- Verification consumes a challenge once, validates user verification, and stores the credential
  ID uniquely without exposing which other account owns a conflict.
- Linking and unlinking rotate all user sessions; unlinking requires recent step-up and cannot
  remove the final usable authentication method.
- Passkey-specific cryptography stays inside a replaceable adapter; domain and persistence code
  depend only on concrete platform contracts.
- PostgreSQL constraints and transactions resolve duplicate/replay/concurrent requests safely.
- Positive, malformed, expired, replay, wrong-origin/RP/session/user, conflict, counter, and
  final-method paths have meaningful unit, integration, and end-to-end boundary coverage.
- Repository gates pass and the task diff receives a deep-review `Converged` verdict.

## Risks and exclusions

- A passkey authorizes off-chain account access only; it never replaces wallet or transaction
  authorization.
- Beta does not permit unauthenticated passkey-first enrollment or implicit account merging.
- This linking slice does not advertise passkey sign-in; a linked credential is not presented as
  an active recovery path until assertion authentication is implemented and qualified.
- Browser/platform authenticator conformance claims require real supported-device evidence and
  remain owned by W2-10.

## Evidence

- Deep review converged after three consecutive no-change passes using dependency-boundary,
  failure/concurrency, and fresh-eyes dynamic-mutation methods.
- Deliberate mutations proved that tests reject future authentication timestamps, an incorrect
  PostgreSQL recent-authentication boundary, false success copy, and omitted session-cookie effects.
- `pnpm format:check`, `pnpm env:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`,
  `pnpm test:integration`, `pnpm test:coverage`, `pnpm migration:check`, and `pnpm build` passed.
- Passkey domain, adapter, and repository coverage is 100% for statements, branches, functions,
  and lines; merged repository line and branch coverage remains above 90%.
- `pnpm --filter @repo/e2e test:e2e` passed 66 tests with 6 intentional viewport exclusions,
  including a real Chromium virtual-authenticator registration and unlink journey on all four
  configured viewports.
