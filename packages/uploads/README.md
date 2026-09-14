# `@ador/uploads`

Provider-neutral application and persistence boundary for durable direct uploads.

## Public API

`createUploadIntentService` validates policy, persists a quota reservation idempotently, and only
then asks `ObjectStoragePort` for a private presigned upload. `createDrizzleUploadIntentRepository`
implements concurrency-safe PostgreSQL reservation.

`complete` verifies the private object exists and has the exact declared byte length. The repository
then atomically creates one pending asset, marks its intent completed, and enqueues the identifier-only
processing event. Replays return that same asset without another storage lookup.

## Invariants

- Authentication is required by the delivery operation.
- The intent exists before a bearer upload URL is issued; URLs are never persisted.
- Each intent is bound to the provider that issued its URL; provider changes fail closed.
- User-row locking serializes the configurable active-intent quota.
- An idempotency key cannot be reused with different input.
- Provider failure releases the active reservation for a same-key retry.
- Completion is owner-scoped, expiry-aware, concurrency-safe, and transactional with its outbox event.
- Completion means accepted for validation; W3-04 owns content validation and later states.

Configuration comes from the validated shared upload policy. Run `env:check`, `typecheck`,
`test:unit`, `test:integration`, or `test:coverage`. Platform engineering owns this package.
