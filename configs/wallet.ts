import type { WalletConnectionConfig } from "@ador/feature-wallet-connection";

export const walletConnectionConfig = {
  candidates: [{ id: "xverse", label: "Xverse" }],
  network: "signet",
} as const satisfies WalletConnectionConfig;
