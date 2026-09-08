# LaserEyes advisory resolution — task record

Status: completed — Converged with accepted beta risk

Baseline: `a4b3bddd33869b6e2c63082af9e4e6de9e3afabb`
Date: 2026-09-08

## Intended outcome

Remove the production dependency advisories inherited through the qualified LaserEyes pair before
wallet authentication is exposed, without forcing incompatible dependency versions or adopting an
unsupported LaserEyes release.

## Current evidence

- The npm `latest` tags remain LaserEyes React `0.0.80` and Core `0.0.85`.
- Both packages have a `0.2.1` artifact, but Core `0.2.1` is publisher-deprecated because that version
  was published incorrectly and consumers are directed to the `0.0.x` line.
- The installed supported pair resolves vulnerable Valibot versions through Orange Connect, the
  direct pre-release Bip32 dependency, and Sats Connect.
- The patched Valibot release is not a compatible drop-in for every affected range. A global
  override would cross incompatible Valibot API generations and is not accepted without upstream
  or provider-conformance evidence.
- `pnpm audit --prod` reports three high, three moderate, and one low production advisories.

## Blocker

No supported patched LaserEyes release currently resolves the graph. Proceeding requires one of:

1. a supported upstream release whose dependency graph passes qualification and audit;
2. a reviewed maintained fork with provenance, ownership, compatibility tests, and an exit plan; or
3. explicit product and engineering acceptance of the remaining advisory risk for the beta, with
   compensating controls and a removal deadline.

Wallet authentication and every later ordered task remain blocked until one option is accepted and
this task's own diff converges under `deep-review-until-clean`.

## Accepted beta exception

On 2026-09-08, the product owner explicitly authorized continuing with the qualified LaserEyes pair
despite the documented transitive advisories. This acceptance is limited to beta development and
does not mean the vulnerabilities are fixed, unreachable, or suitable for mainnet.

Required controls:

- keep wallet functionality disabled until each provider passes its operation-specific conformance
  suite;
- keep the LaserEyes client boundary route-lazy and isolated from authoritative server validation;
- independently validate authentication signatures and returned PSBTs at the server boundary;
- do not pass untrusted user strings into transitive Valibot emoji validation;
- rerun the production audit and full wallet qualification on every dependency change;
- replace the exception with a supported patched release or reviewed maintained fork as soon as one
  is viable, and block mainnet release while a high-severity advisory remains.

The implementation must retain one explicit registry entry per wallet provider and one explicit
registry entry per feature. Removing a provider or feature must not require scattered application
edits; registration remains schema-validated, capability-checked, and testable rather than relying
on filesystem discovery or hidden side effects.

## Audit and verification

- The task was reviewed through whole-file evidence, dependency-path/threat-model, and fresh-eyes
  rule-by-rule passes. Three consecutive passes found no further issue and changed nothing.
- Each pass ran format, environment, lint, TypeScript, unit, integration, coverage, migration,
  production build, Playwright, diff, and repository-policy gates successfully.
- Integration included real PostgreSQL, native and WASM contract tests, the wallet Next.js
  production fixture, and 36 Playwright cases.
- Repository policy checked 16 workspaces and 183 files; enforced line and branch coverage remained
  above 90%.

Verdict: **Converged**. The advisory is accepted for beta under the controls above, not resolved in
the dependency graph. Mainnet remains blocked while a high-severity advisory is present.
