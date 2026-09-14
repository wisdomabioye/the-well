import { describe, expect, it } from "vitest";
import { validateWalletConnectionConfig } from "../src/config.ts";

const valid = {
  candidates: [{ id: "xverse", label: "Xverse" }],
  network: "signet",
} as const;

describe("wallet connection configuration", () => {
  it("returns immutable validated configuration", () => {
    const config = validateWalletConnectionConfig(valid);
    expect(config).toEqual(valid);
    expect(Reflect.set(config, "network", "mainnet")).toBe(false);
    expect(Reflect.set(config.candidates, "0", null)).toBe(false);
    expect(Reflect.set(config.candidates[0] ?? {}, "label", "Changed")).toBe(
      false,
    );
  });

  it.each([
    [{ ...valid, candidates: [] }, "At least one"],
    [{ ...valid, candidates: [{ id: "xverse", label: " " }] }, "display label"],
    [
      { ...valid, candidates: [...valid.candidates, ...valid.candidates] },
      "more than once",
    ],
  ] as const)("rejects invalid candidate configuration", (input, message) => {
    expect(() => validateWalletConnectionConfig(input)).toThrow(message);
  });

  it("rejects a provider outside the pinned LaserEyes artifact", () => {
    const input = {
      candidates: [{ id: "xverse", label: "Xverse" }],
      network: "signet",
    } satisfies Parameters<typeof validateWalletConnectionConfig>[0];
    Reflect.set(input.candidates[0] ?? {}, "id", "not-a-wallet");
    expect(() => validateWalletConnectionConfig(input)).toThrow(
      "Unsupported LaserEyes provider",
    );
  });
});
