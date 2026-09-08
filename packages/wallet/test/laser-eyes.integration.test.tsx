import { readFileSync } from "node:fs";

import { LaserEyesClient, createStores } from "@omnisat/lasereyes-core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createLaserEyesSigner } from "../src/bridge/laser-eyes-signer.ts";
import { WalletProvider } from "../src/client/provider.tsx";
import { qualifiedLaserEyes } from "../src/qualification.ts";

const packageManifest = readFileSync(
  new URL("../package.json", import.meta.url),
  "utf8",
);

describe("LaserEyes package boundary", () => {
  it("keeps qualification metadata aligned with exact manifest pins", () => {
    expect(packageManifest).toContain(
      `"@omnisat/lasereyes-core": "${qualifiedLaserEyes.coreVersion}"`,
    );
    expect(packageManifest).toContain(
      `"@omnisat/lasereyes-react": "${qualifiedLaserEyes.reactVersion}"`,
    );
  });

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
