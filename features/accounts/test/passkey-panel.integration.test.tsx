// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const startRegistration = vi.hoisted(() => vi.fn());
vi.mock("@simplewebauthn/browser", () => ({ startRegistration }));

import { PasskeyPanel } from "../src/ui/passkey-panel.tsx";

function response(body: object, ok = true) {
  return { json: vi.fn(async () => body), ok };
}

function registrationOptions() {
  return {
    challengeId: "01990a03-5d80-7c00-8000-000000000001",
    expiresAt: "2026-09-10T12:05:00.000Z",
    options: {
      challenge: "Y2hhbGxlbmdl",
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      rp: { id: "launch.invalid", name: "Launch" },
      user: { displayName: "Player", id: "cGxheWVy", name: "Player" },
    },
  };
}

function button(container: HTMLElement, label: string): HTMLButtonElement {
  const match = [...container.querySelectorAll("button")].find(
    (candidate) => candidate.textContent?.trim() === label,
  );
  if (!match) throw new Error(`Missing ${label} button`);
  return match;
}

describe("passkey account panel", () => {
  let container: HTMLDivElement;

  beforeAll(() => {
    Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
      configurable: true,
      value: true,
    });
  });

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    container.remove();
    vi.unstubAllGlobals();
  });

  it("links and removes passkeys while showing truthful state", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(registrationOptions()))
      .mockResolvedValueOnce(response({ changed: true }))
      .mockResolvedValueOnce(response({ credentialIds: ["credential"] }))
      .mockResolvedValueOnce(response({ changed: true }))
      .mockResolvedValueOnce(response({ credentialIds: [] }));
    vi.stubGlobal("fetch", fetchMock);
    startRegistration.mockResolvedValue({
      clientExtensionResults: {},
      id: "credential",
      rawId: "credential",
      response: { attestationObject: "value", clientDataJSON: "value" },
      type: "public-key",
    });
    const root = createRoot(container);
    await act(async () =>
      root.render(
        <PasskeyPanel initialCredentialIds={[]} initialUnavailable={false} />,
      ),
    );
    await act(async () => button(container, "Add passkey").click());
    expect(container.textContent).toContain("Passkey linked");
    expect(container.textContent).toContain("Passkey 1");
    await act(async () => button(container, "Remove").click());
    expect(container.textContent).toContain("Passkey removed");
    expect(fetchMock).toHaveBeenCalledTimes(5);
    await act(async () => root.unmount());
  });

  it("fails closed when status loading or linking fails", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response({}, false));
    vi.stubGlobal("fetch", fetchMock);
    const root = createRoot(container);
    await act(async () =>
      root.render(
        <PasskeyPanel initialCredentialIds={[]} initialUnavailable />,
      ),
    );
    expect(container.textContent).toContain("status is unavailable");
    await act(async () => button(container, "Add passkey").click());
    expect(container.textContent).toContain("linking could not be confirmed");
    await act(async () => root.unmount());
  });

  it("does not claim removal when unlinking fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(response({}, false)));
    const root = createRoot(container);
    await act(async () =>
      root.render(
        <PasskeyPanel
          initialCredentialIds={["credential"]}
          initialUnavailable={false}
        />,
      ),
    );
    await act(async () => button(container, "Remove").click());
    expect(container.textContent).toContain("removal could not be confirmed");
    expect(container.textContent).toContain("Passkey 1");
    await act(async () => root.unmount());
  });

  it("reports an unknown outcome when linking succeeds but refresh fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(response(registrationOptions()))
        .mockResolvedValueOnce(response({ changed: true }))
        .mockResolvedValueOnce(response({}, false)),
    );
    startRegistration.mockResolvedValue({
      clientExtensionResults: {},
      id: "credential",
      rawId: "credential",
      response: { attestationObject: "value", clientDataJSON: "value" },
      type: "public-key",
    });
    const root = createRoot(container);
    await act(async () =>
      root.render(
        <PasskeyPanel initialCredentialIds={[]} initialUnavailable={false} />,
      ),
    );
    await act(async () => button(container, "Add passkey").click());
    expect(container.textContent).toContain("could not be confirmed");
    expect(container.textContent).not.toContain("Passkey linked.");
    await act(async () => root.unmount());
  });
});
