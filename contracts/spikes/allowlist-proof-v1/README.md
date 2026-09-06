# Allowlist Proof V1 spike

This research-only crate independently reproduces the TypeScript `AllowlistLeafV1` bytes and
SHA-256 sorted-pair Merkle hashes. It is not a deployable Alkane and does not satisfy D15 claimant
binding. The shared JSON fixture is the cross-language source of truth.

The canonical implementation was inspected at Alkanes revision
`62511e9371a3f9e448841140c51cfe428cfcb955`. Its proof utilities inform the hash convention, but
its output-recipient check is deliberately not copied because it does not prove claimant
authorization.

Run `pnpm contracts:typecheck`, `pnpm contracts:lint`, `pnpm contracts:test`, and
`pnpm contracts:coverage` from the repository root. Coverage pins `cargo-llvm-cov` 0.6.21 for
compatibility with the repository's Rust 1.86 toolchain and enforces line, function, and region
thresholds; stable Rust does not expose branch counts through this toolchain. Product and contract
engineering own this spike and must keep D15 gated until the remaining real-runtime and wallet-flow
acceptance evidence is complete.
