# Creator admission feature

Detachable creator onboarding and staff-review surfaces plus HTTP operations. Register `creatorAdmissionFeature` once in the platform feature registry; removing that line removes its pages and routes.

The feature owns composition only. Domain rules live in `@ador/creator-admission`, contracts in `@ador/shared/creator-admission`, persistence in the Drizzle adapter, and visual grammar in `@repo/ui`.

It requires authenticated pages, studio navigation, API routes, PostgreSQL configuration, and the `creator:review` capability for review operations. It never grants project publication, deployment, launch, mint, or game permissions.

Run `pnpm env:check`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:integration`, and `pnpm test:coverage` from this package.
