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
and unsafe payload rejection. The provider adapter and retry policy are deliberately deferred to
the following workflow slice so no cloud acknowledgement can precede durable persistence.
