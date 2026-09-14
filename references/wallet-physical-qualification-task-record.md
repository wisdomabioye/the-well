# W2-10B — Physical wallet qualification and enablement

Status: in progress
Started: 2026-09-14

## Objective

Qualify Xverse against the exact-pinned LaserEyes boundary on the configured signet network, then
enable only the capabilities supported by complete physical evidence.

## Current slice

- Register a detachable `wallet-connection` feature requiring the generic `wallet:connect`
  capability.
- Expose `/connect` as a qualification-only page with Xverse selected in `configs/wallet.ts`.
- Keep all LaserEyes hooks, provider detection, and lifecycle calls inside `@ador/wallet/client`.
- State explicitly that connection is neither authentication nor provider qualification.

## Remaining gate

Physical testing must still cover connection approval/rejection, account and network changes,
message-signing approval/rejection and server verification, PSBT approval/rejection and server
verification, and the deterministic Alkanes fixture. No provider becomes supported and wallet
sign-in remains disabled until the evaluator accepts fresh, exact-version evidence.
