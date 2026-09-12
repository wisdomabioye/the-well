import { readFileSync } from "node:fs";

import { LaserEyesClient, createStores } from "@omnisat/lasereyes-core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createLaserEyesSigner } from "../src/bridge/laser-eyes-signer.ts";
import { WalletProvider } from "../src/client/provider.tsx";
import { laserEyesProviderIds } from "../src/conformance/contracts.ts";
import { qualifiedLaserEyes } from "../src/qualification.ts";

const packageManifest = readFileSync(
  new URL("../package.json", import.meta.url),
  "utf8",
);
const walletDeclarations = readFileSync(
  new URL(
    "../node_modules/@omnisat/lasereyes-core/dist/constants/wallets.d.ts",
    import.meta.url,
  ),
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

  it("keeps typed provider identifiers aligned with the pinned LaserEyes artifact", () => {
    const addressConstantsStart = walletDeclarations.indexOf(
      "export declare const P2TR",
    );
    expect(addressConstantsStart).toBeGreaterThan(0);
    const constantsSection = walletDeclarations.slice(0, addressConstantsStart);
    const declaredProviders = [...constantsSection.matchAll(/= "([^"]+)";/gu)]
      .map((match) => match[1])
      .sort();
    expect([...laserEyesProviderIds].sort()).toEqual(declaredProviders);
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
