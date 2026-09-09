# Authenticated route family — task record

Status: completed — Converged

Baseline: `be0bed312ff729456e1b66ae4f11095f2e58b66e`
Branch: `feat/database-foundation`
Started: 2026-09-09

## Done means

- Page access is explicit manifest data validated at boot, not path-name convention.
- One Next.js boundary resolves the host-only session cookie and enforces authenticated or platform
  capability requirements before a feature page renders.
- `/account`, `/studio`, and `/admin` are contributed by one detachable accounts feature; removing
  its single registry entry removes the whole route family.
- Missing, expired, revoked, forbidden, and persistence-unavailable states fail closed without
  exposing private content or falsely claiming authentication.
- Positive, negative, capability, detachment, accessibility, responsive, and degraded-state tests
  pass with greater-than-90% package and merged coverage.
- The task diff reaches a deep-review `Converged` verdict before commit or task 7 starts.

## Deliberate boundaries

- This task consumes the existing wallet challenge/session services. It does not duplicate wallet
  verification, add passkeys, or treat wallet connection as authentication.
- Creator admission records and workflows belong to task 7. Studio copy must not imply creator or
  publication approval.
- Organization-scoped resource routes will declare organization capability requirements when those
  resources exist; this task has no organization identifier to authorize.

## Failure modes under review

- A protected page renders before session or capability resolution completes.
- A missing cookie causes needless database access or a provider outage leaks private content.
- An organization role is mistaken for platform staff authority.
- Feature detachment leaves route-specific conditions in the Next.js catch-all.
- Protected and error states visually drift from the arcade design system.

## Verification evidence

- `pnpm format:check`, `pnpm env:check`, `pnpm lint`, and `pnpm typecheck` passed.
- `pnpm test:unit` and the real PostgreSQL/native/WASM `pnpm test:integration` passed.
- `pnpm test:coverage` passed workspace and merged greater-than-90% line and branch thresholds;
  the changed web and accounts surfaces report 100% line and branch coverage.
- `pnpm migration:check`, `pnpm build`, and all 52 Playwright tests passed.
- Mobile, tablet, desktop, and wide home/protected-route snapshots were inspected visually.
- Deliberate mutations proved the cookie fail-closed check, protected-page capability validation,
  runtime singleton wiring, and private-render guard tests fail when their invariants are broken.
- Three independent clean review passes covered sequential whole-file inspection, invariant and
  boundary tracing with mutation probes, and a fresh-eyes final diff/configuration audit.
