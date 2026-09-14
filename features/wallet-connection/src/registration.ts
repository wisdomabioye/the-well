import { defineFeature } from "@ador/plugin-kit";
import type { WalletConnectionConfig } from "./config.ts";
import { validateWalletConnectionConfig } from "./config.ts";

export type { WalletConnectionConfig } from "./config.ts";

export function createWalletConnectionFeature(input: WalletConnectionConfig) {
  const config = validateWalletConnectionConfig(input);
  return defineFeature({
    manifest: {
      capabilities: ["navigation", "public-page"],
      dependencies: [],
      id: "wallet-connection",
      navigation: [
        { access: { kind: "public" }, href: "/connect", label: "Connect" },
      ],
      pages: [{ access: { kind: "public" }, path: "/connect" }],
      requiredDecisionGates: [],
      requiredProviderCapabilities: ["wallet:connect"],
      routes: [],
      version: "1.0.0",
    },
    load: async () =>
      import("@ador/feature-wallet-connection/entrypoint").then(
        ({ createWalletConnectionEntrypoint }) =>
          createWalletConnectionEntrypoint(config),
      ),
  });
}
