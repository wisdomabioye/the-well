# W3-02 — Durable direct-upload intents

Status: converged  
Baseline: `192b45f347b3cdedea2c10e9f3a34d220aee441e`  
Baseline worktree: clean  
Started: 2026-09-13

## Objective

Authorize direct private-object uploads through a durable, quota-aware intent that exists before a
short-lived presigned URL is issued. The workflow must remain provider-neutral and must not treat a
successful upload request as a validated or published asset.

## Approved task boundary

W3-02 owns the minimal upload-intent schema, migration, repository, authorization, quota reservation,
idempotency, opaque draft-key creation, and presigned-upload response. This ordering ensures the
platform records who may upload what before issuing the bearer credential.

W3-03 begins after upload completion and owns asset records, processing state, transactional-outbox
delivery, validation jobs, and reconciliation. It does not retroactively create the authorization
record for an already-issued upload URL.

## Required ordering

1. Authenticate and authorize the requester.
2. Validate the declared purpose, content type, and byte length against versioned policy.
3. Reserve quota and persist the upload intent idempotently.
4. Create a presigned private-object upload for the persisted opaque key.
5. Return the upload contract without logging or persisting the bearer URL.

## Open decisions

None.

## Accepted policy

- Presigned upload URL lifetime defaults to 15 minutes and remains configurable through validated
  server-side policy. Each URL is an ephemeral bearer credential: it is returned only in the API
  response, never stored, and excluded from logs and analytics. An idempotent replay may issue a new
  URL, but never beyond the persisted intent expiry.
- Beta upload purposes are collection artwork, collection banner, collection-item artwork, and
  creator avatar. These are stable internal identifiers with separately configurable display copy.
  Unknown purposes fail closed. Game bundles and arbitrary files are excluded from this pipeline.
- Per-file defaults are 25 MB for collection artwork, 15 MB for collection banners, 25 MB for
  collection-item artwork, and 5 MB for creator avatars. All values remain configurable and apply to
  original encoded bytes; decoded dimensions and pixels are validated separately in W3-04.
- One domain-owned `upload-policy.ts` module is the source of truth for upload-policy defaults.
  Handlers, repositories, provider adapters, and tests consume its validated policy contract rather
  than repeating values. Runtime overrides are parsed and validated before use.
- At most two unexpired upload intents may be active per user across all purposes and projects. The
  limit is configurable and enforced transactionally. The beta has no separate project-level quota;
  organization or project quotas can be introduced when collaborative bulk uploads require them.
- An intent becomes unusable when its 15-minute upload window expires. Unclaimed private objects are
  eligible for deletion after 24 hours, while intent records are retained for 30 days for security
  investigation and operational diagnosis. Each duration remains configurable.

These approved values are implemented as typed policy rather than repeated source literals.

## Implemented slice

- Added shared upload contracts and one validated policy module with partial per-purpose overrides.
- Added the Drizzle upload-intent schema, generated migration, user ownership, lifecycle checks,
  idempotency uniqueness, and active-quota lookup index.
- Added a provider-neutral upload service and PostgreSQL repository. Reservations serialize on the
  owning user, persist before signing, replay safely, reject request drift, and release quota after
  signing failures.
- Added one detachable `uploads` feature registration and an authenticated, same-origin,
  idempotency-required HTTP operation. The feature depends only on the object-storage capability.
- Added positive, negative, expiry, authorization, concurrency, retry, and provider-failure tests.

## Review findings repaired

- Partial byte-limit overrides originally required every upload purpose at compile time even though
  runtime behavior merged partial values. The override type now matches the validated behavior.
- Turbo did not track the root `configs/` composition files as task inputs, allowing a cached web
  build to hide feature-registry changes from browser tests. `configs/**` is now a global dependency,
  with a repository-policy regression test and a build-plus-browser mutation proof.
- Clean-cache verification exposed simultaneous disposable PostgreSQL containers exhausting their
  readiness windows because Docker storage initialized PostgreSQL 18 too slowly. Disposable database
  data now uses container tmpfs, and repository integration and coverage orchestration limit task
  concurrency to two. Tests retain isolated real PostgreSQL boundaries without storage contention.

## Verification evidence

- Full repository gates passed after implementation: environment parity, formatting, lint,
  migration drift, TypeScript, unit tests, integration tests, production build, merged coverage,
  contract coverage, and Playwright E2E.
- Merged line and branch coverage remained above 90%. The upload feature reported 100% line and
  branch coverage; the upload domain package reported 100% lines and 91.66% branches.
- Playwright reported 86 passed and 6 intentionally skipped tests across mobile, tablet, desktop,
  and wide viewports.
- Mutation checks produced the expected failures for policy defaults, schema indexes, size policy,
  quota serialization, authentication/error mapping, runtime caching, route registration, API
  access metadata, feature count, Turbo cache invalidation, and all four visual baselines.

## Convergence review

Repair rounds used M1 line-by-line tracing and M5 adversarial mutation to find and fix the issues
listed above. The clean streak restarted after the last repair:

| Pass | Method                               | Result |
| ---- | ------------------------------------ | ------ |
| 1    | M4 security and threat-model review  | Clean  |
| 2    | M5 restored adversarial mutation run | Clean  |
| 3    | M11 cross-feature consistency review | Clean  |

Verdict: **Converged**. The final three independent passes found no new verified defect and changed
nothing. W3-03 may now consume the durable intent boundary; it must not reinterpret URL issuance as
upload completion or asset validation.
