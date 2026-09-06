import { type AllowlistLeafV1, allowlistLeafV1Schema } from "./schema.js";

export const allowlistLeafV1Domain = "ADOR_ALLOWLIST_LEAF_V1";
const allowlistLeafV1DomainBytes = new TextEncoder().encode(
  allowlistLeafV1Domain,
);

const networkTags = Object.freeze({
  bitcoin: 0,
  testnet: 1,
  signet: 2,
  regtest: 3,
} as const);
const networksByTag = ["bitcoin", "testnet", "signet", "regtest"] as const;

class ByteReader {
  private offset = 0;

  public constructor(private readonly bytes: Uint8Array) {}

  public done(): boolean {
    return this.offset === this.bytes.length;
  }

  public read(length: number): Uint8Array {
    const end = this.offset + length;
    if (
      !Number.isSafeInteger(length) ||
      length < 0 ||
      end > this.bytes.length
    ) {
      throw new RangeError("Allowlist leaf is truncated.");
    }
    const value = this.bytes.slice(this.offset, end);
    this.offset = end;
    return value;
  }

  public readByte(): number {
    const bytes = this.read(1);
    return new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    ).getUint8(0);
  }

  public readUnsigned(byteLength: number): bigint {
    const bytes = this.read(byteLength);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let value = 0n;
    for (let index = bytes.length - 1; index >= 0; index -= 1) {
      value = (value << 8n) | BigInt(view.getUint8(index));
    }
    return value;
  }

  public readOptionalUnsigned(byteLength: number): bigint | null {
    const tag = this.readByte();
    if (tag === 0) return null;
    if (tag !== 1) throw new RangeError("Optional integer tag is unsupported.");
    return this.readUnsigned(byteLength);
  }
}

function encodeUnsigned(value: bigint, byteLength: number): Uint8Array {
  const bytes = new Uint8Array(byteLength);
  let remaining = value;
  for (let index = 0; index < byteLength; index += 1) {
    bytes[index] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
  return bytes;
}

function encodeOptionalUnsigned(
  value: bigint | null,
  byteLength: number,
): Uint8Array {
  return value === null
    ? Uint8Array.of(0)
    : concatenate([Uint8Array.of(1), encodeUnsigned(value, byteLength)]);
}

function concatenate(parts: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(
    parts.reduce((length, part) => length + part.length, 0),
  );
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function encodePaymentAsset(
  asset: AllowlistLeafV1["paymentAsset"],
): Uint8Array {
  return asset.kind === "bitcoin"
    ? Uint8Array.of(0)
    : concatenate([
        Uint8Array.of(1),
        encodeUnsigned(asset.block, 16),
        encodeUnsigned(asset.transaction, 16),
      ]);
}

export function encodeAllowlistLeafV1(input: AllowlistLeafV1): Uint8Array {
  const leaf = allowlistLeafV1Schema.parse(input);
  return concatenate([
    allowlistLeafV1DomainBytes,
    Uint8Array.of(networkTags[leaf.network]),
    leaf.launchCommitment,
    leaf.phaseId,
    encodeUnsigned(BigInt(leaf.snapshotVersion), 4),
    encodeUnsigned(BigInt(leaf.scriptPubKey.length), 2),
    leaf.scriptPubKey,
    encodeUnsigned(leaf.maxAllocation, 16),
    encodePaymentAsset(leaf.paymentAsset),
    encodeOptionalUnsigned(leaf.priceOverride, 16),
    encodeOptionalUnsigned(leaf.validFrom, 8),
    encodeOptionalUnsigned(leaf.validUntil, 8),
  ]);
}

export function decodeAllowlistLeafV1(bytes: Uint8Array): AllowlistLeafV1 {
  const reader = new ByteReader(bytes);
  const domain = reader.read(allowlistLeafV1DomainBytes.length);
  if (
    !domain.every((byte, index) => byte === allowlistLeafV1DomainBytes[index])
  ) {
    throw new RangeError("Allowlist leaf domain is unsupported.");
  }
  const network = networksByTag[reader.readByte()];
  if (network === undefined)
    throw new RangeError("Allowlist network tag is unsupported.");
  const launchCommitment = reader.read(32);
  const phaseId = reader.read(16);
  const snapshotVersion = Number(reader.readUnsigned(4));
  const scriptPubKey = reader.read(Number(reader.readUnsigned(2)));
  const maxAllocation = reader.readUnsigned(16);
  const paymentTag = reader.readByte();
  const paymentAsset =
    paymentTag === 0
      ? ({ kind: "bitcoin" } as const)
      : paymentTag === 1
        ? ({
            block: reader.readUnsigned(16),
            kind: "alkane",
            transaction: reader.readUnsigned(16),
          } as const)
        : null;
  if (paymentAsset === null)
    throw new RangeError("Payment asset tag is unsupported.");
  const leaf = allowlistLeafV1Schema.parse({
    launchCommitment,
    maxAllocation,
    network,
    paymentAsset,
    phaseId,
    priceOverride: reader.readOptionalUnsigned(16),
    scriptPubKey,
    snapshotVersion,
    validFrom: reader.readOptionalUnsigned(8),
    validUntil: reader.readOptionalUnsigned(8),
  });
  if (!reader.done())
    throw new RangeError("Allowlist leaf contains trailing bytes.");
  return leaf;
}
