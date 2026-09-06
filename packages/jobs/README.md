# `@ador/jobs`

Provider-neutral asynchronous job contracts and relay policies.

## Public API and invariants

`relayOutboxBatch` claims a bounded PostgreSQL-backed lease through an injected store, publishes
identifier-only domain events through an injected provider, and persists delivery, retry, or
terminal failure. Provider errors are reduced to non-sensitive operational reasons. Exponential
backoff is bounded and jitter is injected for deterministic testing. An acknowledgement records
transport delivery only; it never represents business completion.

## Verification

Run `typecheck`, `test:unit`, `test:integration`, and `test:coverage` in this workspace. Integration
tests exercise the relay contract with an in-memory conformance store; the database package owns
real-PostgreSQL adapter tests.
