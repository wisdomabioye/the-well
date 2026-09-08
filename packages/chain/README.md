# `@ador/chain`

Provider-neutral Bitcoin and Alkanes boundaries.

## Public API

- `validateBitcoinAddress` decodes and canonically round-trips P2WPKH and P2TR addresses for
  mainnet or signet with `bitcoinjs-lib` 7.0.2.
- `loadAlkanesSdk` is the isolated server-side entrypoint for the immutable
  `@alkanes/ts-sdk@0.1.6-669e7c0` artifact.

## Invariants

Address validation rejects whitespace, non-canonical case, checksum failures, cross-network input,
and script types outside P2WPKH/P2TR. Signet shares Bitcoin's test-network address encoding, so an
address alone cannot distinguish signet from testnet; provider/network agreement remains a separate
authorization check. SDK values do not cross this boundary without application-owned validation.

## Configuration and ownership

Network selection is supplied by validated application configuration. Provider URLs, credentials,
contract IDs, and network values are not owned here. Platform engineering owns this package.

Run the package `typecheck`, `test:unit`, `test:integration`, or `test:coverage` scripts.
