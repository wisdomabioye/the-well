# Public product route families — task record

Status: completed  
Task: `W2-08`  
Baseline: `c891be1e618d90067844a7e7a260efc52f9de32f`

## Scope

Implement the detachable public discovery route family for launches, collections, creators, and
games. This task establishes truthful, accessible route and navigation surfaces. Collection,
launch, mint, and game persistence or transactions remain owned by their later milestone tasks.

## Done criteria

- One explicit feature-registry line installs or removes each domain route family.
- Public index and parameterized detail paths resolve without app-owned feature branching.
- Route parameters are validated; malformed or unowned paths fail closed, while syntactically valid
  detail placeholders explicitly report that no published record is available.
- Every surface follows the shared arcade design system and exposes honest empty or not-found state.
- Navigation has no dead public-product links and remains keyboard- and small-screen-usable.
- Unit, integration, and Playwright tests cover success, invalid input, unknown paths, detachment,
  accessibility-oriented semantics, responsive rendering, and reduced motion.
- Relevant repository gates pass, coverage remains above policy thresholds, source files remain at
  most 300 lines, and the task receives a deep-review `Converged` verdict.

## Risks and boundaries

- Dynamic route templates must not create ambiguous ownership or silently shadow static routes.
- Slugs are untrusted URL input and cannot become domain identifiers without validation.
- Empty discovery surfaces must not imply launches, collections, creators, games, minting, or
  on-chain state exists before authoritative implementations provide it.
- This feature may expose stable presentation contracts but must not depend on future feature
  internals or choose their persistence models.

## Evidence

- Four independent registry lines install the launch, collection, creator, and game route families;
  the platform shell derives its product navigation from the registered feature IDs.
- Dynamic page manifests validate named parameters, boot rejects overlapping dynamic ownership,
  and runtime resolution prefers exact static pages before extracting frozen route parameters.
- Unit and integration suites cover safe and unsafe slugs, contribution drift, route ownership,
  static precedence, unknown paths, truthful empty/detail states, and both launch/game detachment.
- Mutation proof deliberately broke slug validation, parameter extraction, route collisions,
  duplicate parameter rejection, static precedence, registry context propagation, both detachment
  branches, truthful copy, registration identity, composition, navigation, reduced motion, and
  visual layout; each corresponding test failed before restoration.
- `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test:unit`,
  `pnpm test:integration`, `pnpm test:coverage`, and `pnpm build` passed. Merged line and branch
  coverage remained above 90%; the changed platform-shell package reached 100% branch coverage.
- `pnpm --filter @repo/e2e test:e2e` passed 65 tests across mobile, tablet, desktop, and wide
  projects with three intentional environment-specific skips. Reviewed snapshots cover the home
  shell and public discovery surface; accessibility, keyboard, reduced-motion, positive, and
  negative route behavior also passed.
- Deep review completed three consecutive no-change passes: M1 requirements traceability;
  combined M4 state/failure, M5 contract-boundary, and M11 adversarial review; then deterministic
  M12 operational-readiness review. Final verdict: `Converged`.
