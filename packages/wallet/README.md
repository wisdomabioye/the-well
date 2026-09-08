# `@ador/wallet`

The single platform boundary around the exact-pinned LaserEyes React/Core pair.

## Public API

- `WalletProvider` composes LaserEyes without exposing wallet-specific adapters.
- `createLaserEyesSigner` adapts one connected LaserEyes client to the narrow signer contract used
  by Alkanes application services.
- Wallet contracts normalize account, network, and signed-PSBT results without leaking broad vendor
  response types.

## Invariants

Signing requires a connected provider, the configured network, and a complete account. The bridge
always requests signing without broadcast and rejects an unexpected transaction ID or incomplete
PSBT encodings. Application and server layers must independently validate addresses, challenges,
signatures, transaction intent, and returned PSBTs.

No wallet is enabled merely because LaserEyes exposes it. Provider enablement requires the shared
device/browser/network/operation conformance suite. The platform does not use LaserEyes' deprecated
Alkanes construction APIs or SDK keystore/mnemonic features.

## Temporary compatibility exception

The user approved LaserEyes React 0.0.80/Core 0.0.85 despite Core's deprecated transitive `alkanes`
dependency because the ecosystem integration currently relies on this published pair. Top-level
versions remain exact, and the floating Git transitive dependency is overridden to commit
`7a3326b12702c044424d10b37c048e06ebefb3d2` for reproducibility. The exception does not permit direct
imports from deprecated `alkanes`, does not qualify its transaction behavior, and must be removed
when LaserEyes publishes a compatible release without that dependency.

The resolved graph currently carries a high-severity Valibot advisory. LaserEyes React is
pre-bundled, so module provenance cannot prove that its transitive implementation is absent from the
client artifact. No provider or wallet-input flow is enabled by this qualification; resolving or
explicitly accepting this advisory is a security gate before wallet authentication is exposed.

Network selection is provided by validated configuration. Platform engineering owns this package.
Run its `typecheck`, `test:unit`, `test:integration`, or `test:coverage` scripts.
