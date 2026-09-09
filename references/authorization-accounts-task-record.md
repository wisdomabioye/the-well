# Authorization and account records — task record

Status: completed

Baseline: `96f001db14cfe651e26e75df462857773bd2408d`
Branch: `feat/database-foundation`
Started: 2026-09-09

## Accepted decisions

- D11 organization roles are `owner`, `admin`, `editor`, and `analyst`.
- Reviewer and staff authority is platform-scoped and must never be inferred from organization
  membership.
- Role-to-capability mappings are explicit, schema-validated, and versioned policy supplied to the
  authorization service. This task does not invent an implicit role hierarchy.
- Account persistence remains provider-neutral PostgreSQL with generated Drizzle migrations and
  inferred persistence types.

## Done means

- Organization, membership, and platform-role records have database constraints and generated
  migrations.
- A detachable authorization package resolves an actor through repository ports and evaluates
  organization and platform capabilities from one validated policy contract.
- Organization creation establishes its initial owner atomically. Membership changes cannot remove
  or demote the last active owner, and concurrent changes preserve that invariant.
- Suspended organizations or memberships cannot gain active capabilities.
- Positive, negative, cross-organization, stale-record, concurrency, rollback, and real-PostgreSQL
  tests pass with greater-than-90% package and merged coverage.
- The task diff reaches a deep-review `Converged` verdict before it is committed or task 6 starts.

## Deliberate boundaries

- Creator approval, review workflow state, and separation-of-duty rules belong to task 7.
- HTTP cookies, route handlers, and protected page UX belong to task 6.
- Wallet or transaction proof remains a separate requirement for on-chain authority; an off-chain
  role never substitutes for it.

## Failure modes under review

- A user applies an organization role to another organization or to a platform-only action.
- Two concurrent owner changes leave an organization without an active owner.
- A suspended membership or organization retains cached authority.
- Policy/version drift changes authorization without an explicit deployment decision.
- A database failure leaves an organization without its initial owner.
