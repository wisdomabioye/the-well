# Creator admission — task record

Status: complete — deep review converged

Baseline: `a8b7f97682637fc68bfdddffd5f6f0752a844e17`
Branch: `feat/database-foundation`
Started: 2026-09-09

## Done means

- An authenticated user can create and edit a private creator application draft and submit an
  immutable, schema-versioned review snapshot.
- Creator admission follows centralized, exhaustive transitions for draft, submitted, under-review,
  approved, changes-requested, rejected, suspended, reinstated, and revoked states.
- Only an actor with the configured creator-review capability can review an application, and no
  applicant can review their own submission.
- Review decisions persist structured reason codes, appropriate creator-facing feedback, private
  reviewer notes, policy/schema versions, actor, timestamps, and correlation identifiers in one
  transaction.
- Creator approval grants no project, publication, deployment, moderation, or wallet authority.
- Account, studio, and admin surfaces show truthful admission and review states without exposing
  another applicant's private evidence or staff-only notes.
- Positive, negative, authorization, transition, idempotency, concurrency, privacy, accessibility,
  responsive, and degraded-state tests pass with required coverage.
- The task diff reaches a deep-review `Converged` verdict before commit or W2-08 starts.

## Deliberate boundaries

- This slice implements creator admission only. Project-version review starts with W4-03.
- Invitation behavior, durable draft/upload quotas, appeals, expiry, cooling-off, notification, and
  retention remain gated follow-up policy and are not invented here.
- Verified contact identity is required before approval. This task must consume genuinely verified
  identity evidence or fail closed; neither a submitted email string nor a passkey is verification.
- Application evidence is structured text and links only; asset upload references wait for Week 3.

## Failure modes under review

- A reviewer approves their own application or acts after losing staff capability.
- Retried submission/review requests create conflicting snapshots or duplicate audit effects.
- Draft edits mutate evidence already submitted for review.
- Concurrent review, suspension, and revocation writes produce an invalid terminal state.
- Private evidence or reviewer notes leak through applicant-facing reads or UI.

## Delivered

- Added provider-neutral creator-admission contracts, schemas, exhaustive transitions, service
  ports, and a Drizzle repository behind one explicit feature registration.
- Persisted one private application per applicant, immutable schema-versioned snapshots, verified
  contact evidence, and append-only review events with actor, policy, correlation, and request
  fingerprints.
- Bound idempotency keys to the validated operation and payload so altered, cross-operation,
  cross-actor, and cross-application reuse fails closed while identical retries replay safely.
- Rechecked reviewer capability and verified contact inside locked database transactions, blocked
  self-review, and serialized concurrent draft, submission, and review state changes.
- Added authenticated studio and reviewer surfaces, CSRF origin enforcement using the configured
  public origin, optional fields aligned to shared schemas, stale-draft submission prevention, and
  truthful error/degraded states.
- Added unit, real-PostgreSQL integration, HTTP/access, UI, coverage, migration, and authenticated
  Playwright evidence, including positive and negative paths.

## Review findings repaired

1. Idempotency originally matched only actor/application, allowing changed payloads or another
   operation to replay an unrelated success. Request fingerprints now enforce semantic identity.
2. Unsaved form edits could be visible while submission snapshotted the last saved draft. The
   submit control now remains disabled until the visible draft is saved.
3. Reviewer actions could be sent twice before React committed its disabled state. A synchronous
   request guard now serializes client submissions; the database remains authoritative.
4. Optional creator-feedback, evidence, and portfolio fields were browser-required despite the
   shared schema. The rendered form now matches the schema.
5. The Next adapter compared mutation origins to an internal request hostname. It now compares
   against the validated, configurable `PUBLIC_BASE_URL` origin.
6. The E2E fixture entered coverage scope without an instrumented contract test. Its UUIDv7 and
   identity-separation invariants are now tested.
7. Stale account/studio copy described already-delivered creator tools as future behavior.
8. The creator form retained its initial state after successful mutations, allowing an unsaved
   application to submit and leaving mutation controls active after submission. It now tracks each
   validated server response, gates first submission on a saved draft, and closes editing when the
   authoritative state is no longer editable.

## Deep-review progress

The initial M1 whole-file pass and M4 producer/consumer comparison found the issues above and reset
the streak. Every edited handwritten file was subsequently re-read in full; generated Drizzle
snapshots, generated SQL migrations, the pnpm lockfile, and binary visual baselines were validated
through their generators or executable consumers.

| Pass | Method                       | Evidence                                                                                                             |
| ---- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1    | M7 runtime observation       | Complete restored gates, production build, real PostgreSQL tests, and Playwright passed without a finding or edit    |
| 2    | M4 producer/consumer tracing | Schemas, service, repository, HTTP registration, Next adapter, UI, and E2E consumers aligned without finding or edit |
| 3    | M11 house-rule audit         | Binding rules, typed boundaries, configuration, dependencies, source limits, and truthful states remained clean      |

Terminal verdict: **Converged**. The exhaustive mutation proof, restored gates, and three
consecutive method-distinct clean passes are complete.

### Exhaustive mutation matrix

Recorded red → restore → green proofs:

- `packages/config/test/authorization.unit.test.ts` — removed the reviewer capability; the policy
  separation test failed on the missing capability and passed after restoration.
- `packages/shared/test/creator-admission.unit.test.ts` — independently bypassed declaration
  acceptance, raised the display-name boundary, and removed draft submission; each corresponding
  test failed on its guarded assertion and passed after restoration.
- `packages/database/test/creator-admission-schema.unit.test.ts` — renamed one required constraint
  on each creator table; all three corresponding schema tests failed independently and passed after
  restoration.
- `packages/creator-admission/test/service.unit.test.ts` — replaced the authoritative clock and
  bypassed draft validation in focused runs, then jointly changed submission schema version,
  submission validation, reviewer-role derivation, and fingerprint derivation. Each of the six
  named service tests was observed failing on its own guarded assertion; all passed after exact
  restoration.
- Changed HTTP tests — removed protected-operation security metadata, changed the cookie security
  scheme, substituted actor identity, and replaced registered-operation input. The five affected
  tests failed on their guarded contracts and passed after restoration.
- `features/creator-admission/test/*` entrypoint, registration, runtime, operations, forms, and
  surface suites — removed contributions, drifted manifest/runtime identity, bypassed service
  caching and authorization, changed error mapping, stale-draft locking, optional fields, request
  routing, response validation, review serialization, page modes, and degraded-state rendering.
  All 18 tests failed on their corresponding assertions and the six focused suites passed after
  restoration. A restoration mismatch was detected by the green check, corrected, and both
  affected UI suites were re-read and rerun successfully.

- Real-PostgreSQL lifecycle/persistence suites — independently broke six lifecycle invariants and
  seven persistence invariants covering transitions, rejected-state closure, replay fingerprints,
  not-found behavior, reviewer revocation, required snapshots, snapshot hashes, verified contact,
  self-review, concurrent submission, and serialized first-draft creation. All 13 tests failed on
  their guarded database behavior and passed after restoration against the same isolated database.
- Next, platform, plugin, and fixture suites — changed access/error mapping, CSRF enforcement,
  adapter status propagation, platform feature counts, route contribution identity, and seeded
  identity/session uniqueness. All eleven affected tests failed on their corresponding assertions and
  passed after restoration.
- Changed/new Playwright tests — detached creator admission to prove protected-route registration,
  changed the platform status count to prove the versioned API assertion, and redirected reviewer
  submission to prove the stateful applicant-to-reviewer journey. Each target test failed in a
  production build for the intended reason; after exact restoration, the production build and all
  53 applicable Playwright tests passed, with 3 intentional non-desktop journey skips.
- Creator form state regression — independently removed the saved-draft and submitted-application
  state updates. The new enable-after-save and disable-after-submit assertions each failed for the
  intended reason, then the focused form suite passed after exact restoration.

The exhaustive mutation matrix and restored full gates are complete. After the final repair, three
consecutive method-distinct clean passes found nothing and changed nothing.

## Verification evidence

- `pnpm format:check` — passed.
- `pnpm lint` — passed, including Cargo formatting/clippy and repository policy checks.
- `pnpm typecheck` — passed for all 21 workspaces and Rust contracts; test files are included.
- `pnpm test:unit` — passed for all 21 workspaces.
- `pnpm test:integration` — passed, including disposable PostgreSQL suites and Rust native/WASM
  contract tests.
- `pnpm test:coverage` — passed the repository `>90%` gate. Changed core workspaces reported:
  creator admission 95.41% statements / 91.17% branches / 100% functions / 100% lines; database
  98.97% / 100% / 98.03% / 98.94%; web 100% for all metrics; E2E support 100% for all metrics.
- `pnpm migration:check` and `pnpm env:check` — passed.
- `pnpm test:e2e` — production build passed; Playwright reported 53 passed and 3 intentional
  non-desktop skips. The stateful creator journey ran once on desktop; shared route, accessibility,
  keyboard, reduced-motion, and visual checks ran across mobile, tablet, desktop, and wide projects.
- Repository policy checked 291 files; all handwritten source and test files are at most 300 lines.

## Remaining gated scope

- Invitation policy, appeals, expiry/cooling-off, notifications, retention, and durable quotas stay
  unimplemented until their product decisions are accepted.
- The broader Week 2 responsive/accessibility closure remains `W2-11`; this slice covers its own
  introduced states without claiming that milestone-wide gate is complete.
