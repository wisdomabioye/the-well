# `@ador/database`

Server-only, provider-neutral PostgreSQL infrastructure for the platform.

## Public API

- Strict database environment parsing and migration URL fallback.
- Standard `pg` pool construction with explicit TLS and timeout policy.
- Drizzle client construction and explicit migration application.
- The shared `ador` PostgreSQL schema boundary.
- Transactional outbox insertion, lease-based claiming, acknowledgement, retry, and exhausted
  failure transitions.

Feature repository ports remain owned by their features. This package will provide their Drizzle
adapters as domain tables are accepted; it never exports database rows as HTTP contracts.

## Portability and invariants

- Requires standard PostgreSQL 18; no Railway or Supabase SDK is imported.
- Production changes use reviewed generated migrations. Schema push is not exposed.
- Migrations run as an explicit deployment step, never on application startup.
- Outbox rows preserve event identity across at-least-once delivery attempts. Concurrent relays use
  PostgreSQL row locks and expiring leases; stale workers cannot acknowledge another lease.
- `DATABASE_MIGRATION_URL` falls back to `DATABASE_URL` only when it is absent or blank.
- TLS, pool sizing, and timeouts come only from validated configuration.
- Public identifier policy remains gated, so the baseline migration creates only the application
  schema and no speculative durable tables.

## Verification

`test:integration` and `test:coverage` start a disposable `postgres:18.6-alpine` container, apply
the committed migration to an empty database, exercise constraints and rollback, then remove the
container. Docker is therefore required for these commands.

```bash
pnpm --filter @ador/database env:check
pnpm --filter @ador/database migration:check
pnpm --filter @ador/database migration:apply
pnpm --filter @ador/database typecheck
pnpm --filter @ador/database test:unit
pnpm --filter @ador/database test:integration
pnpm --filter @ador/database test:coverage
```
