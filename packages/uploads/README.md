# `@ador/uploads`

Provider-neutral application and persistence boundary for durable direct-upload intents.

## Public API

`createUploadIntentService` validates policy, persists a quota reservation idempotently, and only
then asks `ObjectStoragePort` for a private presigned upload. `createDrizzleUploadIntentRepository`
implements concurrency-safe PostgreSQL reservation.

## Invariants

- Authentication is required by the delivery operation.
- The intent exists before a bearer upload URL is issued; URLs are never persisted.
- User-row locking serializes the configurable active-intent quota.
- An idempotency key cannot be reused with different input.
- Provider failure releases the active reservation for a same-key retry.

Configuration comes from the validated shared upload policy. Run `env:check`, `typecheck`,
`test:unit`, `test:integration`, or `test:coverage`. Platform engineering owns this package.
