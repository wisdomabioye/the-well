# W2-11 — Week 2 experience-quality matrix

Status: completed
Baseline: `ea2bbcd`
Baseline worktree: clean
Started: 2026-09-12

## Objective

Close responsive visual regression, accessibility, keyboard, reduced-motion, and truthful-state
coverage for every public, protected, authenticated account/studio/admin, creator-application, and
creator-review route family delivered in Week 2.

## Done criteria

1. Mobile, tablet, desktop, and wide projects exercise every Week 2 route family.
2. Authenticated surfaces use real persisted test sessions and the same host-only cookie contract.
3. Automated WCAG checks, keyboard entry, reduced-motion behavior, and horizontal-overflow checks
   cover protected and authorized surfaces as well as public pages.
4. Stable full-page visual baselines cover each materially distinct Week 2 surface at every viewport.
5. Tests retain truthful unavailable/unauthenticated states and do not claim physical wallet
   qualification from W2-10B.
6. Repository gates pass and this task's diff receives a `Converged` deep-review verdict.

## Approach

Add one table-driven Playwright matrix and a shared E2E session-cookie helper. Keep stateful creator
and passkey journeys separate; this task verifies their stable entry states without mutating them.

## Risks and boundaries

- Automated accessibility checks supplement but do not replace manual assistive-technology review.
- Screenshot fixtures are evidence only when paired with semantic, keyboard, and state assertions.
- W2-10B remains the physical wallet/browser/device release gate and is not altered by this task.

## Audit and landing

Verdict: **Converged**. Three consecutive independent passes found no remaining verified defect and
changed nothing:

1. M4 producer/consumer review traced seeded users, sessions, role assignments, cookies, route
   requirements, Playwright projects, and screenshot names end to end.
2. M11 walked every repository rule over the repaired diff and found no further verified defect.
3. M7 reran the complete runtime gate set on the unchanged repaired tree.

The earlier M5 mutation pass proved every changed test can fail for its claimed reason. Every changed
source/test file is below 250 lines. The E2E utility workspace reports 100% statement, branch,
function, and line coverage; merged repository line and branch coverage remains above 90%.

Full verification passed: formatting, lint/repository policy, TypeScript and Rust checks, unit tests,
real-PostgreSQL integration tests, production build, merged TypeScript/Rust coverage, and Playwright
(86 passed, 6 intentionally skipped). The new matrix contributes 20 stable checks across account,
studio, creator application, creator review, and staff admin surfaces on mobile, tablet, desktop, and
wide viewports; each asserts semantics, WCAG 2.2 AA automation, keyboard entry, reduced motion,
horizontal containment, and a reviewed full-page baseline. The final deep review additionally fixed
two harness defects: containment now measures the clipped `.app-shell` scroll area rather than the
body, and pnpm's argument separator is removed before focused arguments reach Playwright.
