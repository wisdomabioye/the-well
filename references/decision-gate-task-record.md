# Task record: enforced decision gates

- Baseline: `877a8cc`
- Branch: `feat/database-foundation`
- Scope: typed decision records, fail-closed gate evaluation, feature/provider boot enforcement,
  generated-reference drift detection, and CI/build validation.

## Invariants

- A decision is accepted only with a named owner, acceptance date, selected outcome, ADR path, and
  at least one evidence path.
- Pending, researching, proposed, and superseded decisions never open a gate.
- Accepted decisions supply exactly the declared required fields with no placeholders or extras.
- Gate and decision identifiers are unique, and every gate dependency resolves.
- Features and providers explicitly declare required gates; platform boot rejects closed or missing
  gates before loading their entrypoints.
- Root builds and CI validate the catalog and its generated reference. Accepted ADR and evidence
  paths must exist.

## Known closed gates

The catalog truthfully records D15 as researching and D13, D14, D17, D18, D19, and D22 as
unresolved. No flag, default, placeholder, or mock opens their dependent gates.

## Verification

- Passed: `pnpm decision:check`, `pnpm format:check`, `pnpm env:check`, `pnpm lint`,
  `pnpm typecheck`, `pnpm test:unit`, `pnpm test:integration`, `pnpm test:coverage`,
  `pnpm migration:check`, `pnpm build`, and `pnpm --filter @repo/e2e test:e2e`.
- Integration and coverage checks ran against the repository's real disposable PostgreSQL container;
  Playwright ran five Chromium journeys against the production build.
- Merged line and branch coverage remained above 90%. The changed shared decision module reported
  100% statements, branches, functions, and lines; plugin-kit reported 98.96% statements and 97.22%
  branches; repository-policy reported 96.68% statements and 92.1% branches.
- Mutation probes proved tests fail when decision validation, gate closure, boot enforcement,
  manifest immutability, serialization, generated-reference drift, or evidence-file checks are
  removed. Every probe was restored before the final gates.
- The landing commit containing this record is the authoritative commit for the slice.
