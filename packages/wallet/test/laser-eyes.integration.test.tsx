import { LaserEyesClient, createStores } from "@omnisat/lasereyes-core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createLaserEyesSigner } from "../src/bridge/laser-eyes-signer.ts";
import { WalletProvider } from "../src/client/provider.tsx";

describe("LaserEyes package boundary", () => {
  it("accepts the exact-pinned client through the signer bridge", () => {
    const client = new LaserEyesClient(createStores(), { network: "signet" });
    const signer = createLaserEyesSigner({
      client,
      getState: () => ({
        address: "",
        connected: false,
        network: client.$network.get(),
        provider: undefined,
        publicKey: "",
      }),
      network: "signet",
    });

    expect(signer.getSignerType()).toBe("lasereyes");
  });

  it("renders the React provider without browser globals during SSR", () => {
    expect(
      renderToStaticMarkup(
        <WalletProvider network="signet">
          <span>child</span>
        </WalletProvider>,
      ),
    ).toContain("child");
  });
});
