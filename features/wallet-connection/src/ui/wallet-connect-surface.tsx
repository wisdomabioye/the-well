import { WalletProvider } from "@ador/wallet/client";
import { AppShell, ArcadePanel, StatusLamp } from "@repo/ui/arcade";
import type { NavigationItem } from "@ador/plugin-kit/navigation";
import type { WalletConnectionConfig } from "../config.ts";
import { WalletConnectPanel } from "./wallet-connect-panel.tsx";

export function WalletConnectSurface({
  config,
  navigation,
}: {
  readonly config: WalletConnectionConfig;
  readonly navigation: readonly NavigationItem[];
}) {
  return (
    <WalletProvider network={config.network}>
      <AppShell
        brand="Adorbitals"
        footerLabel="Wallet qualification"
        homeHref="/"
        navigation={navigation}
        notices={["◆ SELF CUSTODY", "▲ NO BROADCAST", "★ QUALIFICATION MODE"]}
      >
        <section className="arcade-section arcade-section--raised">
          <StatusLamp label="Physical qualification pending" tone="attention" />
          <p className="arcade-eyebrow">Wallet connection</p>
          <h1>Connect a candidate wallet</h1>
          <p>
            Connect only verifies the browser integration. Signing in remains
            disabled until the complete wallet evidence matrix passes.
          </p>
          <ArcadePanel eyebrow="W2-10B" title="Qualification candidate">
            <WalletConnectPanel candidates={config.candidates} />
          </ArcadePanel>
        </section>
      </AppShell>
    </WalletProvider>
  );
}
