import { describe, expect, it } from "vitest";

import {
  allowlistLeafV1Domain,
  allowlistLeafV1Limits,
  allowlistLeafV1Schema,
  calculateAllowlistRoot,
  decodeAllowlistLeafV1,
  encodeAllowlistLeafV1,
  hashAllowlistLeaf,
  hashAllowlistNode,
} from "../src/allowlists/index.js";

const bytes = (length: number, fill = 0): Uint8Array =>
  new Uint8Array(length).fill(fill);
const hex = (value: Uint8Array): string => Buffer.from(value).toString("hex");

const leaf = {
  launchCommitment: bytes(32, 1),
  maxAllocation: 3n,
  network: "regtest",
  paymentAsset: { kind: "bitcoin" },
  phaseId: bytes(16, 2),
  priceOverride: null,
  scriptPubKey: bytes(34, 3),
  snapshotVersion: 1,
  validFrom: null,
  validUntil: null,
} as const;

describe("Allowlist Leaf V1", () => {
  it("round-trips every supported tagged field", () => {
    const withOptionals = {
      ...leaf,
      paymentAsset: { block: 4n, kind: "alkane", transaction: 9n },
      priceOverride: 5_000n,
      validFrom: 100n,
      validUntil: 200n,
    } as const;
    expect(decodeAllowlistLeafV1(encodeAllowlistLeafV1(withOptionals))).toEqual(
      withOptionals,
    );
    expect(decodeAllowlistLeafV1(encodeAllowlistLeafV1(leaf))).toEqual(leaf);
  });

  it.each([
    { ...leaf, launchCommitment: bytes(31) },
    { ...leaf, maxAllocation: 0n },
    { ...leaf, phaseId: bytes(15) },
    { ...leaf, scriptPubKey: bytes(0) },
    {
      ...leaf,
      scriptPubKey: bytes(allowlistLeafV1Limits.maximumScriptByteLength + 1),
    },
    { ...leaf, snapshotVersion: 0 },
    { ...leaf, validFrom: 2n, validUntil: 1n },
  ])("rejects a non-canonical leaf", (candidate) => {
    expect(() => allowlistLeafV1Schema.parse(candidate)).toThrow();
  });

  it("rejects truncated, trailing, and unsupported tagged encodings", () => {
    const encoded = encodeAllowlistLeafV1(leaf);
    const domainByteLength = new TextEncoder().encode(
      allowlistLeafV1Domain,
    ).length;
    const networkOffset = domainByteLength;
    const paymentOffset =
      networkOffset + 1 + 32 + 16 + 4 + 2 + leaf.scriptPubKey.length + 16;
    const firstOptionalOffset = paymentOffset + 1;
    expect(() => decodeAllowlistLeafV1(encoded.slice(0, -1))).toThrow(
      "truncated",
    );
    expect(() =>
      decodeAllowlistLeafV1(Uint8Array.from([...encoded, 0])),
    ).toThrow("trailing");

    const invalidDomain = encoded.slice();
    invalidDomain[0] = 0;
    expect(() => decodeAllowlistLeafV1(invalidDomain)).toThrow("domain");

    const invalidNetwork = encoded.slice();
    invalidNetwork[networkOffset] = 255;
    expect(() => decodeAllowlistLeafV1(invalidNetwork)).toThrow("network");

    const invalidPayment = encoded.slice();
    invalidPayment[paymentOffset] = 255;
    expect(() => decodeAllowlistLeafV1(invalidPayment)).toThrow(
      "Payment asset",
    );

    const invalidOptional = encoded.slice();
    invalidOptional[firstOptionalOffset] = 255;
    expect(() => decodeAllowlistLeafV1(invalidOptional)).toThrow(
      "Optional integer",
    );
  });
});

describe("allowlist Merkle hashing", () => {
  const left = hashAllowlistLeaf(Uint8Array.of(1));
  const right = hashAllowlistLeaf(Uint8Array.of(2));

  it("sorts sibling pairs and changes when a leaf is mutated", () => {
    expect(hashAllowlistNode(left, right)).toEqual(
      hashAllowlistNode(right, left),
    );
    expect(hex(hashAllowlistLeaf(Uint8Array.of(1)))).not.toBe(
      hex(hashAllowlistLeaf(Uint8Array.of(0))),
    );
  });

  it("calculates a bounded proof and rejects unsafe proof shapes", () => {
    expect(calculateAllowlistRoot(Uint8Array.of(1), [right], 1)).toEqual(
      hashAllowlistNode(left, right),
    );
    expect(() => calculateAllowlistRoot(Uint8Array.of(1), [], 1)).toThrow(
      "depth",
    );
    expect(() => calculateAllowlistRoot(Uint8Array.of(1), [right], 0)).toThrow(
      "maximumDepth",
    );
    expect(() =>
      calculateAllowlistRoot(Uint8Array.of(1), [right], NaN),
    ).toThrow("maximumDepth");
    expect(() =>
      calculateAllowlistRoot(Uint8Array.of(1), [right, left], 1),
    ).toThrow("depth");
    expect(() => hashAllowlistNode(bytes(31), right)).toThrow("32 bytes");
    expect(() => hashAllowlistNode(left, bytes(31))).toThrow("32 bytes");
    expect(hashAllowlistNode(left, left)).toHaveLength(32);
  });
});
