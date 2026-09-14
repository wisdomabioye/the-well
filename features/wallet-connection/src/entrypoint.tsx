import type { FeatureEntrypoint } from "@ador/plugin-kit";
import type { WalletConnectionConfig } from "./config.ts";
import { WalletConnectSurface } from "./ui/wallet-connect-surface.tsx";

export function createWalletConnectionEntrypoint(
  config: WalletConnectionConfig,
): FeatureEntrypoint {
  return {
    capabilities: ["navigation", "public-page"],
    id: "wallet-connection",
    pages: [
      {
        access: { kind: "public" },
        path: "/connect",
        render: ({ navigation }) => (
          <WalletConnectSurface config={config} navigation={navigation} />
        ),
      },
    ],
    version: "1.0.0",
  };
}
