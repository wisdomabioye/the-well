# Allowlist Proof V1 spike

This research-only crate independently reproduces the TypeScript `AllowlistLeafV1` bytes and
SHA-256 sorted-pair Merkle hashes. It also contains a runtime-compatible claimant-signature
verifier for native P2TR key-path and P2WPKH inputs. It is not a deployable Alkane and does not by
itself satisfy D15. The shared JSON fixture is the cross-language leaf source of truth.

The canonical implementation was inspected at Alkanes revision
`62511e9371a3f9e448841140c51cfe428cfcb955`. Its proof utilities inform the hash convention, but
its output-recipient check is deliberately not copied because it does not prove claimant
authorization.

## Claimant-binding fixture

The verifier accepts consensus-encoded transaction bytes, the claimant input index, and one
previous output per transaction input. It requires native SegWit, an exact P2TR or P2WPKH witness
shape, a claimant script matching the signature key, and an all-committing sighash: `SIGHASH_ALL`
for P2WPKH and either standard `SIGHASH_DEFAULT` or explicit `SIGHASH_ALL` for P2TR. Consequently
the claimant signature commits every input outpoint and sequence plus every output, including the
Alkanes action output supplied by the eventual transaction builder. Modified outputs, outpoints,
prevout values, keys, signatures, witness shapes, and alternative sighash modes fail verification.

The supplied prevouts become authoritative only for a transaction accepted by Bitcoin consensus;
an offline simulation must resolve them independently before presenting an authorization result.
This invariant cannot be replaced by trusting proof payload data. The deterministic fixtures run
natively and inside `wasm32-unknown-unknown`; their measured weights are 609 WU for P2WPKH, 568 WU
for default-sighash P2TR, and 569 WU for explicit-all P2TR with the current research action output.
These figures are observations, not accepted fee or transaction budgets.

On wasm32, a narrow adapter reads the transaction directly through the exact-pinned Alkanes runtime
host interface. The adapter is compile-verified here; full state-transition execution belongs to
the subsequent canonical indexer-harness task and remains part of the D15 acceptance gate.

Run `pnpm contracts:typecheck`, `pnpm contracts:lint`, `pnpm contracts:test`, and
`pnpm contracts:coverage` from the repository root. Contract tests include native and wasm32
execution. Coverage pins `cargo-llvm-cov` 0.6.21 for
compatibility with the repository's Rust 1.86 toolchain and enforces line, function, and region
thresholds; stable Rust does not expose branch counts through this toolchain. Product and contract
engineering own this spike and must keep D15 gated until the remaining real-runtime and wallet-flow
acceptance evidence is complete.
