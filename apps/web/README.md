# `web`

Next.js delivery shell for The Well launchpad and game arcade.

The application consumes the boot-validated composition from `configs/platform.ts`; feature and
provider entries remain explicit in their respective config registries. It currently presents only
honest foundation-stage controls; wallet and transaction actions remain gated.

One optional page catch-all and one API catch-all translate framework requests into registry
contributions. Adding or removing a feature does not require a Next.js page or route-handler edit.
OpenAPI is assembled from the same registered operations.

## Commands

Run these from the repository root:

```bash
pnpm --filter web dev
pnpm --filter web env:check
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web test:unit
pnpm --filter web test:integration
pnpm --filter web test:coverage
pnpm --filter web build
```

Browser behavior is verified by the root `pnpm test:e2e` command against the standalone production
build. Shared domain logic belongs in a domain-specific package rather than in this delivery app.
