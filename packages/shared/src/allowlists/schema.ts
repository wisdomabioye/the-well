import { z } from "zod";

const uint32Maximum = 4_294_967_295;
const uint64Maximum = 18_446_744_073_709_551_615n;
const uint128Maximum = 340_282_366_920_938_463_463_374_607_431_768_211_455n;
export const allowlistLeafV1Limits = Object.freeze({
  maximumScriptByteLength: 10_000,
  minimumScriptByteLength: 1,
});

const uint8ArraySchema = z.custom<Uint8Array>(
  (value) => value instanceof Uint8Array,
  "Expected a Uint8Array.",
);

const bytesSchema = (length: number) =>
  uint8ArraySchema.refine((value) => value.length === length, {
    message: `Expected exactly ${length} bytes.`,
  });

const uint128Schema = z.bigint().min(0n).max(uint128Maximum);
const optionalBlockHeightSchema = z
  .bigint()
  .min(0n)
  .max(uint64Maximum)
  .nullable();

export const allowlistNetworkSchema = z.enum([
  "bitcoin",
  "testnet",
  "signet",
  "regtest",
]);

export const paymentAssetSchema = z.discriminatedUnion("kind", [
  z
    .object({ kind: z.literal("bitcoin") })
    .strict()
    .readonly(),
  z
    .object({
      block: uint128Schema,
      kind: z.literal("alkane"),
      transaction: uint128Schema,
    })
    .strict()
    .readonly(),
]);

export const allowlistLeafV1Schema = z
  .object({
    launchCommitment: bytesSchema(32),
    maxAllocation: uint128Schema.min(1n),
    network: allowlistNetworkSchema,
    paymentAsset: paymentAssetSchema,
    phaseId: bytesSchema(16),
    priceOverride: uint128Schema.nullable(),
    scriptPubKey: uint8ArraySchema.superRefine((value, context) => {
      if (
        value.length < allowlistLeafV1Limits.minimumScriptByteLength ||
        value.length > allowlistLeafV1Limits.maximumScriptByteLength
      ) {
        context.addIssue({
          code: "custom",
          message: "Script byte length is outside the accepted bounds.",
        });
      }
    }),
    snapshotVersion: z.number().int().min(1).max(uint32Maximum),
    validFrom: optionalBlockHeightSchema,
    validUntil: optionalBlockHeightSchema,
  })
  .strict()
  .readonly()
  .superRefine((leaf, context) => {
    if (
      leaf.validFrom !== null &&
      leaf.validUntil !== null &&
      leaf.validFrom > leaf.validUntil
    ) {
      context.addIssue({
        code: "custom",
        message: "validFrom must not exceed validUntil.",
        path: ["validUntil"],
      });
    }
  });

export type AllowlistLeafV1 = z.infer<typeof allowlistLeafV1Schema>;
