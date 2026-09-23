# `@repo/config`

Canonical environment metadata, application environment validation, and checked-in template parity
for The Well.

Environment definitions describe ownership, exposure, requirement, and secret status. Runtime
schemas narrow process input at application boundaries, while `env:check` ensures every documented
environment template contains the canonical keys in the same order. `apps/web/.env.example` mirrors
the root contract because Next.js loads `apps/web/.env.local`; ignored value files are checked for
the same key inventory without inspecting or logging their values.
