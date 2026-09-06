# Task record: transactional outbox foundation

- Baseline: `ae1d1f9`
- Branch: `feat/database-foundation`
- Scope: identifier-only domain-event envelopes, transactional insertion, concurrent lease claims,
  crash recovery, acknowledgement, retry scheduling, and inspectable exhausted failure.

## Invariants

- Events are inserted only through a caller-owned PostgreSQL transaction so business state and
  asynchronous intent cannot diverge.
- Event identity and payload do not change across attempts.
- Payloads contain identifier references only; secrets, signed URLs, complete records, and large
  artifacts fail runtime validation.
- `FOR UPDATE SKIP LOCKED` prevents concurrent relays from claiming the same available row.
- Expired leases are reclaimable, while active and terminal rows are not.
- Only the current lease can acknowledge, retry, or fail a delivery.
- Database checks enforce coherent lease and delivery timestamps.

## Verification

The real-PostgreSQL suite covers transaction rollback, duplicate identity, concurrent claims,
expired-lease recovery, stale acknowledgement, delayed retry, exhausted failure, invalid policies,
and unsafe payload rejection. The provider-neutral retry policy and database adapter are now
implemented. The signed provider adapter remains gated by `workflow-adapter-gate.md`, so no cloud
acknowledgement is represented before its dependency and runtime checks satisfy repository policy.
