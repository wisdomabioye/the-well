# `@repo/eslint-config`

Shared flat ESLint presets for TypeScript, React, Next.js, and Turbo environment-variable checks.

Generated build and coverage directories are ignored centrally. Consumer packages keep warnings at
zero and expose their own `lint` scripts so the root Turbo gate covers every workspace.
