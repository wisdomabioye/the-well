# W3-01A — Typed provider runtime resolution

Status: completed  
Baseline: `c11897e17bf70634c78106574220ab1893d876e5`  
Baseline worktree: clean  
Started: 2026-09-13

## Objective

Close the provider-composition gap discovered while tracing W3-02: a feature must be able to resolve
the selected object-storage service through a typed capability without importing the R2 adapter.

## Done criteria

1. Provider registrations expose runtime services behind capability-owned types while preserving
   lazy loading and fail-fast configuration when a service is resolved.
2. The registry rejects ambiguous capability ownership, missing services, and manifest/runtime drift.
3. The R2 provider supplies `ObjectStoragePort` through `object-storage:s3-compatible`; consumers do
   not import R2 modules.
4. Positive, negative, integration, coverage, file-length, and full repository gates pass, and the
   task diff reaches a Converged deep-review verdict before landing.

## Approach and risks

Use a TypeScript capability-to-service map that neutral contract packages extend through explicit
module augmentation. Provider packages implement those contracts but do not own the consumer-facing
type mapping. Keep provider metadata loadable without secrets; instantiate and validate the selected
service only when `resolve` is called. Reject duplicate capability providers rather than silently
selecting by order. Avoid a service locator with untyped casts, vendor types, or filesystem discovery.

The work intentionally does not implement upload policy, intent persistence, or HTTP operations;
those remain W3-02 and W3-03 responsibilities.

## Implementation

- The registry resolves a service by its declared capability and rejects duplicate ownership,
  missing factories, missing selected services, undeclared services, and loaded-manifest drift.
- Entrypoint loads and runtime service instances are cached, including concurrent resolution.
- The neutral object-storage package owns its capability-to-port mapping. R2 implements that mapping
  and validates its environment lazily when the selected service is first resolved.
- A feature can resolve `ObjectStoragePort` while importing no R2 module.

## Audit and landing

The review repaired two findings: the original provider-owned type augmentation leaked adapter
ownership into consumers, and the first provider-free type test violated the lint contract. It also
added explicit concurrent-resolution coverage during the execution-path review.

Mutation proofs observed the intended red result for duplicate ownership, load/service caching,
unregistered capabilities, absent factories, absent selected services, undeclared services, R2
registration wiring, valid resolution, missing configuration, and provider-free type mapping. Exact
restoration returned the focused suites to green.

Final gates: environment parity, formatting, lint and repository policy (24 workspaces, 361 files),
typecheck, unit, integration with disposable PostgreSQL and MinIO, build, merged coverage, and
Playwright E2E passed. Merged line and branch coverage were greater than 90%; the changed provider
registry measured 100% statements, branches, functions, and lines. Playwright reported 86 passed and
6 intentionally skipped. Every changed handwritten source and test file is below 300 lines.

Deep-review clean streak: M1 whole-file sequential read, M5 mutation/runtime proof, and M11 house-rule
audit, with the required M4 producer/consumer contract diff completed before the streak. Verdict:
Converged. Landing commit: this task's `feat(plugins): resolve typed provider runtimes` commit.
