import { readFile } from "node:fs/promises";

import { z } from "zod";
import { describe, expect, it } from "vitest";

import {
  calculateAllowlistRoot,
  decodeAllowlistLeafV1,
  encodeAllowlistLeafV1,
  hashAllowlistLeaf,
} from "../src/allowlists/index.js";

const nullableDecimalSchema = z.string().regex(/^\d+$/u).nullable();
const paymentAssetFixtureSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("bitcoin") }).strict(),
  z
    .object({
      block: z.string().regex(/^\d+$/u),
      kind: z.literal("alkane"),
      transaction: z.string().regex(/^\d+$/u),
    })
    .strict(),
]);
const fixtureSchema = z.object({
  canonicalAlkanesRevision: z.string().regex(/^[a-f0-9]{40}$/u),
  rootHex: z.string().regex(/^[a-f0-9]{64}$/u),
  vectors: z.array(
    z.object({
      encodedHex: z.string().regex(/^(?:[a-f0-9]{2})+$/u),
      hashHex: z.string().regex(/^[a-f0-9]{64}$/u),
      input: z.object({
        launchCommitmentHex: z.string(),
        maxAllocation: z.string(),
        network: z.enum(["bitcoin", "testnet", "signet", "regtest"]),
        paymentAsset: paymentAssetFixtureSchema,
        phaseIdHex: z.string(),
        priceOverride: nullableDecimalSchema,
        scriptPubKeyHex: z.string(),
        snapshotVersion: z.number(),
        validFrom: nullableDecimalSchema,
        validUntil: nullableDecimalSchema,
      }),
      name: z.string().min(1),
    }),
  ),
});

const fromHex = (value: string): Uint8Array =>
  Uint8Array.from(Buffer.from(value, "hex"));
const toHex = (value: Uint8Array): string => Buffer.from(value).toString("hex");
const optionalBigInt = (value: string | null): bigint | null =>
  value === null ? null : BigInt(value);

describe("cross-language Allowlist Leaf V1 fixtures", () => {
  it("matches canonical bytes, hashes, and order-independent root", async () => {
    const serialized = await readFile(
      new URL("./fixtures/allowlist-leaf-v1.json", import.meta.url),
      "utf8",
    );
    const fixture = fixtureSchema.parse(JSON.parse(serialized));
    const hashes = fixture.vectors.map(({ encodedHex, hashHex, input }) => {
      const paymentAsset =
        input.paymentAsset.kind === "bitcoin"
          ? input.paymentAsset
          : {
              block: BigInt(input.paymentAsset.block),
              kind: input.paymentAsset.kind,
              transaction: BigInt(input.paymentAsset.transaction),
            };
      const leaf = {
        launchCommitment: fromHex(input.launchCommitmentHex),
        maxAllocation: BigInt(input.maxAllocation),
        network: input.network,
        paymentAsset,
        phaseId: fromHex(input.phaseIdHex),
        priceOverride: optionalBigInt(input.priceOverride),
        scriptPubKey: fromHex(input.scriptPubKeyHex),
        snapshotVersion: input.snapshotVersion,
        validFrom: optionalBigInt(input.validFrom),
        validUntil: optionalBigInt(input.validUntil),
      };
      const encoded = encodeAllowlistLeafV1(leaf);
      expect(toHex(encoded)).toBe(encodedHex);
      expect(decodeAllowlistLeafV1(encoded)).toEqual(leaf);
      expect(toHex(hashAllowlistLeaf(encoded))).toBe(hashHex);
      return fromHex(hashHex);
    });
    const [firstVector, secondVector] = fixture.vectors;
    const [firstHash, secondHash] = hashes;
    if (!firstVector || !secondVector || !firstHash || !secondHash) {
      throw new Error(
        "The cross-language fixture requires exactly two seed vectors.",
      );
    }
    expect(
      toHex(
        calculateAllowlistRoot(
          fromHex(firstVector.encodedHex),
          [secondHash],
          1,
        ),
      ),
    ).toBe(fixture.rootHex);
    expect(
      toHex(
        calculateAllowlistRoot(
          fromHex(secondVector.encodedHex),
          [firstHash],
          1,
        ),
      ),
    ).toBe(fixture.rootHex);
  });
});
