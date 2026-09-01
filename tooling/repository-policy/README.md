# `@repo/repository-policy`

Executable repository invariants for The Well. The package validates workspace test scripts,
handwritten source-file limits, and initial architectural import boundaries. It also combines
workspace coverage summaries and LCOV records into a root report while enforcing greater-than-90%
line and branch coverage per workspace and in aggregate.

Run `pnpm repository:check` for static policies and `pnpm repository:coverage` after workspace
coverage reports exist. The root lint and coverage commands invoke these gates automatically.
