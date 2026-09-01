# `web`

Next.js delivery shell for The Well launchpad and game arcade.

The application composes explicitly registered features from `configs/features.ts` and reusable
arcade components from `@repo/ui`. It currently presents only honest foundation-stage controls;
wallet and transaction actions remain gated.

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
