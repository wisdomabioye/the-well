# Task record: provider registry and boot validation

- Baseline: `ae1d1f9`
- Branch: `feat/database-foundation`
- Scope: provider manifests, explicit provider registration, required-capability checks, route and
  operation collision detection, and the application composition-root boot manifest.

## Invariants

- Provider IDs are unique, manifests are strict and immutable, and loaded entrypoints must match
  their declared identity, version, and capabilities.
- Features declare provider requirements and versioned API route contributions explicitly.
- Platform boot fails on missing provider capabilities, method/path collisions, operation-ID
  collisions, or route contributions without the `api-routes` feature capability.
- Dynamic route parameter names do not conceal equivalent route shapes.
- Registration stays explicit; no filesystem discovery or import-time registration side effects.

## Verification

Run the plugin-kit unit, integration, and coverage suites, then the repository-wide formatting,
lint, environment, type, unit, integration, coverage, build, and Playwright gates. Critical provider
and boot modules require complete branch coverage.
