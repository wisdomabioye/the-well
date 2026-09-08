# Detachable feature composition — task record

Status: converged

Baseline: `5de163e36951c5cd625e74f74dced5f483ed18cf`
Implementation commit: `a82f3e4`
Date: 2026-09-08

## Outcome

Make feature and provider detachment an enforced architecture property. A feature or provider is
enabled by one explicit registry entry, owns its implementation and contributions, and can be
removed without scattered application edits.

## Required evidence

- Generic framework adapters dispatch registered API operations without one route file per feature.
- Navigation and page content are contributed through feature-owned contracts.
- LaserEyes is represented by one wallet-layer provider registration; individual wallet choices
  remain typed configuration and require separate conformance evidence before enablement.
- Removing a registry entry removes its contributions, with tests proving no hidden registration or
  application coupling remains.
- Boot validation still rejects collisions, missing capabilities, closed decisions, and manifest
  drift.

## Delivered architecture

- `configs/features.ts` and `configs/providers.ts` are the only composition roots. Enabling or
  disabling a feature or provider is one explicit registry-list edit.
- Feature entrypoints own page renderers and HTTP operations. The Next.js catch-all page and API
  adapters resolve contributions generically instead of importing feature internals.
- `platformComposition` exposes only registries that passed boot validation, so adapters cannot
  bypass collision, capability, decision-gate, or contribution-drift checks.
- The platform shell owns its page UI, operation factory, manifest, entrypoint, and tests inside
  `features/platform-shell`.
- The wallet package owns the LaserEyes provider entrypoint and lazy registration. Detaching its
  single provider registration removes the runtime contribution.
- Page paths are canonical and schema validated. Unknown page and API paths return truthful 404
  states, while unsupported methods retain the HTTP operation's typed 405 behavior.

## Defects found and repaired

1. Generic adapters initially consumed an unvalidated feature registry. They now use the validated
   `platformComposition` result.
2. Unknown page and API adapter behavior lacked direct negative tests. Both boundaries now have
   regression coverage.
3. Page manifests accepted trailing slashes that Next.js canonicalizes differently. The manifest
   schema now rejects non-canonical paths.
4. Moving the shell UI into its feature left it outside that package's coverage surface. A
   feature-owned DOM unit suite now covers the renderer.
5. Workspace-source imports used compiled suffixes that Turbopack could not resolve. TypeScript
   source extensions are enabled explicitly and lazy imports use their resolvable source path.
6. Feature and web coverage inventories omitted the moved TSX UI and generic Next.js adapters. Both
   inventories now include the actual source patterns and have mutation-proven configuration tests.
7. Runtime contribution validation ignored operation IDs, allowing the manifest, collision checks,
   and generated OpenAPI contract to drift. Complete method, path, and operation-ID identity is now
   enforced.
8. The infrastructure-owned OpenAPI route could be shadowed by a feature that still passed boot.
   Infrastructure routes are now explicit reserved boot inputs and collision-tested.
9. Manifests accepted dynamic routes although generic dispatch had no path-parameter contract. Route
   declarations now reject parameters until typed parsing and validation are designed explicitly.

## Review evidence

Three consecutive post-repair passes found no further verified defects and changed no production
behavior:

| Pass | Method                         | Evidence                                                                                                                                                                                           |
| ---- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | M1 whole-file sequential read  | Every changed hand-maintained file was read end to end; generated lockfile changes were checked through the package manager and diff.                                                              |
| 2    | M5 mutation/adversarial review | Deliberate breaks to routing, schema validation, boot checks, registry detachment, HTTP erasure, wallet registration, and UI behavior made their owning tests fail, then passed after restoration. |
| 3    | M11 policy and full-gate audit | Repository policy checked 16 workspaces and 189 files; full lint, type, test, coverage, build, and browser gates passed.                                                                           |

Final verification:

- `pnpm format:check`, `pnpm lint`, and `pnpm typecheck`: passed.
- `pnpm test:unit` and `pnpm test:integration`: passed, including PostgreSQL, native Rust,
  WebAssembly, Fastify portability, wallet bundling, and Next.js qualification boundaries.
- `pnpm test:coverage`: passed merged line and branch thresholds above 90%; changed critical
  adapters and registration modules report 100% coverage.
- `pnpm build`: passed with the generic page and API routes in the production route manifest.
- `pnpm test:e2e`: 36/36 passed across mobile, tablet, desktop, and wide viewports, including
  visual, accessibility, keyboard, reduced-motion, API, and OpenAPI checks.
- `git diff --check`: passed; repository source-file limits passed.

Verdict: **Converged**.
