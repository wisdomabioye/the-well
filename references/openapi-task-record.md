# Task record: generated OpenAPI contract

- Baseline: `ae1d1f9`
- Branch: `feat/database-foundation`
- Scope: framework-neutral OpenAPI 3.1 generation, operation metadata, feature route registration,
  and a Next.js delivery adapter at `/api/v1/openapi`.

## Invariants

- Request and response schemas are generated from the executable Zod operation contracts.
- Correlation, idempotency, boundary-error, method-error, internal-error, and declared
  application-error contracts are documented without maintaining parallel interfaces.
- The document contains no deployment domain or server URL.
- Duplicate method/path descriptions fail document creation.
- Unsupported platform methods use the shared 405 envelope rather than a framework-specific body.

## Verification

- Formatting, lint, environment parity, typecheck, unit, integration, coverage, migration drift,
  production build, and Playwright E2E gates pass.
- Merged line and branch coverage remains above 90%; the HTTP and web packages reach 100%.
- A mutation replacing the documented output schema with the input schema was caught by the web
  integration contract test, proving schema-drift coverage is effective.
