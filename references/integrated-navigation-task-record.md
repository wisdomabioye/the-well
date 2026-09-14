# W2-12 — Integrated feature navigation and truthful authentication entry

Status: completed
Baseline: `128467c6d1877ade99416662f426cd929d1d7350`
Baseline worktree: clean
Started: 2026-09-14

## Objective and done criteria

Make every currently user-testable page discoverable through the rendered application without
coupling the Next.js shell to individual features.

Done requires:

1. Navigation is declared by feature manifests, schema-validated, immutable, and aggregated by the
   feature registry.
2. Removing a feature registration removes its navigation without edits to the shell or another
   feature.
3. Public navigation reaches launches, collections, creators, games, and the account access state.
4. Authenticated navigation reaches account, studio, and creator application pages; platform
   navigation exposes staff destinations while their authoritative route guards remain enforced.
5. Wallet sign-in remains visibly gated until physical qualification task `W2-10B` is complete; no
   control claims that an unavailable sign-in ceremony works.
6. Unit, integration, browser reachability, accessibility, responsive, keyboard, and reduced-motion
   tests cover positive and detached-feature behavior.
7. Repository gates pass and this task's diff receives a Converged review verdict.

## Approach and boundaries

- Keep navigation metadata in each detachable feature manifest, aggregate it in the feature registry,
  and pass the access-filtered immutable list through the page render context.
- Filter navigation by public, authenticated, or platform audience without treating visibility as
  authorization. Destination route guards remain authoritative.
- Do not add a wallet picker or authentication ceremony in this task. Physical provider evidence is
  absent, so the account route may explain the gate but must not offer a misleading live action.

## Delivered behavior

- Each feature owns validated navigation contributions beside its page declarations. A destination
  must be a static page owned by the same feature, and duplicate destinations fail registry creation.
- The registry returns runtime-frozen contributions. Public, authenticated, and per-user capability
  filters return runtime-frozen render data and fail closed when authorization is unavailable.
- Public users can reach every catalog and the truthful account gate. Authenticated users can reach
  account, studio, and creator admission; staff and reviewer links are independently authorized.
- The prior hard-coded product menu and protected-panel shortcuts were removed. Detaching one registry
  line now removes that feature's pages and navigation without editing the shell.

## Review repairs and evidence

The review repaired: a source file over the 300-line limit by splitting its tests; stale task-record
architecture; navigation without an owned page; mutable aggregate/filter results; a staff-visible
review shortcut without reviewer authority; and account copy that incorrectly called every session
wallet-backed. The final browser pass also exposed a six-pixel status-glow instability; the visual
harness now removes that nondeterministic shadow while retaining the element, color, text, layout,
and production styling under test.

Mutation proof deliberately inverted audience filtering, exposed privileged links on authorization
failure, emptied registry navigation, removed aggregate immutability, and disabled owned-page
validation. The relevant tests failed for each mutation and passed after exact restoration.

Verified commands:

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm repository:check` passed.
- Focused shared, plugin-kit, feature, and web unit/integration suites passed.
- Repository coverage passed its merged strict greater-than-90% line and branch policy; Rust coverage
  measured 98.99% lines, 100% functions, and 94.55% regions.
- The production Playwright suite passed 102 applicable checks across mobile, tablet, desktop, and
  wide viewports; six existing browser-ceremony variants were skipped by their project constraints.
- Updated visual baselines were manually inspected for public, protected, account, studio, admin, and
  creator admission layouts.

Review verdict: **Converged** — after the repairs and mutation pass, three independent clean passes
(whole-file sequential read, runtime observation, and house-rule audit) found no further verified
findings and made no changes.
