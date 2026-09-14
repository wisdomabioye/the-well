# Wallet connection feature

Public, qualification-only wallet connection UI. It depends on the generic `wallet:connect`
provider capability and consumes the normalized `@ador/wallet/client` boundary; feature code never
calls an individual wallet extension.

Register `createWalletConnectionFeature(config)` once in `configs/features.ts`. Removing that line
removes the route and navigation. Candidate wallets and the Bitcoin network are validated
configuration. A successful connection is not authentication and does not enable a provider;
W2-10B physical evidence remains authoritative.

Run `typecheck`, `test:unit`, `test:integration`, or `test:coverage` from this workspace.
