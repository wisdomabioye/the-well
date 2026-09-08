import { describe, expect, it, vi } from "vitest";

import {
  createLaserEyesSigner,
  type LaserEyesSignerDependencies,
  type LaserEyesState,
} from "../src/bridge/laser-eyes-signer.ts";

const connectedState: LaserEyesState = {
  address: "tb1qclaimant",
  connected: true,
  network: "signet",
  provider: "xverse",
  publicKey: "02publickey",
};

function createDependencies(
  state: LaserEyesState = connectedState,
): LaserEyesSignerDependencies {
  return {
    client: {
      disconnect: vi.fn(),
      signMessage: vi.fn(async () => "signature"),
      signPsbt: vi.fn(async () => ({
        signedPsbtBase64: "signed-base64",
        signedPsbtHex: "signed-hex",
      })),
    },
    getState: () => state,
    network: "signet",
  };
}

describe("createLaserEyesSigner", () => {
  it("normalizes account, message, and non-broadcast PSBT signing", async () => {
    const dependencies = createDependencies();
    const signer = createLaserEyesSigner(dependencies);

    await expect(signer.getAccount()).resolves.toEqual({
      address: connectedState.address,
      network: "signet",
      publicKey: connectedState.publicKey,
    });
    await expect(signer.getAddress()).resolves.toBe(connectedState.address);
    await expect(signer.getPublicKey()).resolves.toBe(connectedState.publicKey);
    await expect(signer.isConnected()).resolves.toBe(true);
    await expect(signer.signMessage("challenge")).resolves.toBe("signature");
    await expect(
      signer.signPsbt("psbt", {
        finalize: true,
        inputsToSign: [{ address: connectedState.address, index: 1 }],
      }),
    ).resolves.toEqual({
      psbtBase64: "signed-base64",
      psbtHex: "signed-hex",
    });
    expect(dependencies.client.signMessage).toHaveBeenCalledWith("challenge", {
      toSignAddress: connectedState.address,
    });
    expect(dependencies.client.signPsbt).toHaveBeenCalledWith({
      broadcast: false,
      finalize: true,
      inputsToSign: [{ address: connectedState.address, index: 1 }],
      tx: "psbt",
    });
  });

  it("signs multiple PSBTs without broadcasting and disconnects", async () => {
    const dependencies = createDependencies();
    let concurrentCalls = 0;
    let maximumConcurrentCalls = 0;
    dependencies.client.signPsbt = vi.fn(async ({ tx }) => {
      concurrentCalls += 1;
      maximumConcurrentCalls = Math.max(
        maximumConcurrentCalls,
        concurrentCalls,
      );
      await Promise.resolve();
      concurrentCalls -= 1;
      return { signedPsbtBase64: `${tx}-base64`, signedPsbtHex: `${tx}-hex` };
    });
    const signer = createLaserEyesSigner(dependencies);

    await expect(signer.signPsbts(["first", "second"])).resolves.toEqual([
      { psbtBase64: "first-base64", psbtHex: "first-hex" },
      { psbtBase64: "second-base64", psbtHex: "second-hex" },
    ]);
    await signer.disconnect();

    expect(dependencies.client.signPsbt).toHaveBeenCalledTimes(2);
    expect(maximumConcurrentCalls).toBe(1);
    expect(dependencies.client.disconnect).toHaveBeenCalledOnce();
    expect(signer.getSignerType()).toBe("lasereyes");
  });

  it.each([
    [{ ...connectedState, connected: false }, "connected LaserEyes wallet"],
    [{ ...connectedState, provider: undefined }, "connected LaserEyes wallet"],
    [{ ...connectedState, network: "mainnet" }, "wrong Bitcoin network"],
    [{ ...connectedState, address: "" }, "account is incomplete"],
    [{ ...connectedState, publicKey: "" }, "account is incomplete"],
  ] as const)("rejects an invalid connection state", async (state, message) => {
    const signer = createLaserEyesSigner(createDependencies(state));
    await expect(signer.getAccount()).rejects.toThrow(message);
    await expect(signer.isConnected()).resolves.toBe(false);
  });

  it.each([
    [undefined, "incomplete signed PSBT"],
    [{ signedPsbtBase64: "", signedPsbtHex: "hex" }, "incomplete signed PSBT"],
    [
      { signedPsbtBase64: "base64", signedPsbtHex: "" },
      "incomplete signed PSBT",
    ],
    [
      { signedPsbtBase64: "base64", signedPsbtHex: "hex", txId: "broadcast" },
      "broadcast a PSBT",
    ],
  ] as const)("rejects unsafe signing output", async (response, message) => {
    const dependencies = createDependencies();
    dependencies.client.signPsbt = vi.fn(async () => response);
    const signer = createLaserEyesSigner(dependencies);

    await expect(signer.signPsbt("psbt")).rejects.toThrow(message);
  });
});
