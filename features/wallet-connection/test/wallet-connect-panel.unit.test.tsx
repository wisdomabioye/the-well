// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WalletConnectionClient } from "@ador/wallet/client";

const connect = vi.fn(async () => undefined);
const disconnect = vi.fn();
let client: WalletConnectionClient;

vi.mock("@ador/wallet/client", () => ({
  useWalletConnection: () => client,
}));

import { WalletConnectPanel } from "../src/ui/wallet-connect-panel.tsx";

const candidates = [{ id: "xverse", label: "Xverse" }] as const;
let container: HTMLDivElement;
let root: Root;

async function render(): Promise<void> {
  await act(async () =>
    root.render(<WalletConnectPanel candidates={candidates} />),
  );
}

function button(): HTMLButtonElement {
  const element = container.querySelector("button");
  if (!(element instanceof HTMLButtonElement))
    throw new Error("Expected button");
  return element;
}

describe("wallet connect panel", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    connect.mockReset();
    connect.mockResolvedValue(undefined);
    disconnect.mockReset();
    client = {
      address: "",
      connect,
      connected: false,
      connecting: false,
      disconnect,
      installationUrl: () => "https://www.xverse.app/",
      isInstalled: () => true,
      network: "signet",
      provider: null,
    };
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it("delegates connection to the configured candidate", async () => {
    await render();
    await act(async () => button().click());
    expect(connect).toHaveBeenCalledWith("xverse");
    expect(container.textContent).not.toContain("failed");
  });

  it("reports a rejected connection without claiming success", async () => {
    connect.mockRejectedValueOnce(new Error("rejected"));
    await render();
    await act(async () => button().click());
    expect(container.textContent).toContain(
      "connection was rejected or failed",
    );
  });

  it("links to installation when the extension is absent", async () => {
    client = { ...client, isInstalled: () => false };
    await render();
    const link = container.querySelector("a");
    expect(link?.textContent).toContain("Install Xverse");
    expect(link?.getAttribute("href")).toBe("https://www.xverse.app/");
  });

  it("shows connected state and delegates disconnect", async () => {
    client = {
      ...client,
      address: "tb1q12345678901234567890",
      connected: true,
      provider: "xverse",
    };
    await render();
    expect(container.textContent).toContain("tb1q1234…34567890");
    await act(async () => button().click());
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("disables the control while connection is pending", async () => {
    client = { ...client, connecting: true };
    await render();
    expect(button().disabled).toBe(true);
    expect(button().textContent).toBe("Connecting…");
  });

  it("shows a short connected address without truncation", async () => {
    client = { ...client, address: "short", connected: true };
    await render();
    expect(container.textContent).toContain("short");
  });
});
