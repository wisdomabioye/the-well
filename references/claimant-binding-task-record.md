# D15 claimant-binding transaction fixture — task record

Status: Converged

Baseline: `02aea7cd657cef8f4de581dfa2698f47b5f2574d`

## Task boundary

Prove that native P2TR key-path and P2WPKH claimant signatures authorize the complete transaction
action rather than merely matching a recipient output. Keep D15 researching and do not implement
allocation state, a production contract, or wallet enablement in this slice.

## Implemented evidence

- Exact-pinned `bitcoin` 0.32.5, matching the resolved version at the inspected canonical Alkanes
  revision, supplies transaction parsing, sighash construction, and secp256k1 verification.
- Both claimant paths require an all-committing sighash, native SegWit script shape, exact witness
  cardinality, and a signature key matching the committed claimant script. P2TR accepts its
  standard `SIGHASH_DEFAULT` encoding or explicit `SIGHASH_ALL`; P2WPKH requires `SIGHASH_ALL`.
- The Taproot verifier requires the complete prevout set; a count mismatch fails before signature
  verification.
- Deterministic signed fixtures prove success and rejection after output/action mutation, outpoint
  replay, wrong prevout value, wrong key/script, malformed signature, extra witness data, non-empty
  scriptSig, unsupported script, and alternate sighash modes.
- The same four behavioral fixtures execute natively and under `wasm32-unknown-unknown`.
- A wasm-only adapter reads immutable transaction bytes through the exact-pinned canonical Alkanes
  runtime host interface. Its dependency resolution is pinned to the compatible versions recorded
  by that canonical revision rather than current drifting transitive ranges.

## Remaining D15 gate after this task

- Exercise a stateful claim contract through the canonical Alkanes indexer harness with a real
  protostone action and authoritative prevout resolution.
- Record fuel and final witness/calldata weight using that action encoding.
- Qualify the signed PSBT flow through LaserEyes and the selected Alkanes SDK bridge.

D15 remains researching. LaserEyes/SDK signing qualification, allocation accounting, root
supersession, reorg behavior, and the entitlement fallback remain later D15 evidence.

## Verification

- Native Rust: 9 tests passed; wasm claimant suite: 4 tests passed.
- Rust coverage: 98.99% lines, 94.55% regions, and 100% functions. Stable Rust does not expose
  branch coverage through this runner.
- Merged TypeScript coverage passed the repository's greater-than-90% line and branch thresholds.
- Deliberate mutations proved the tests reject signature-verification bypass, malformed-shape
  guard removal, and rejection of valid Taproot authorization. Each mutation was restored before
  the clean review sequence.
- Formatting, environment parity, lint and repository policy, type checking, unit tests,
  PostgreSQL-backed integration tests, coverage, production build, and all 5 Playwright tests
  passed.
- Three clean post-restoration review passes covered producer/consumer contract tracing,
  repository-rule and dependency review, and runtime/coverage-path inspection.
