import { sha256 } from "@noble/hashes/sha2.js";

export const allowlistHashByteLength = 32;

function compareBytes(left: Uint8Array, right: Uint8Array): number {
  const sharedLength = Math.min(left.length, right.length);
  const leftView = new DataView(left.buffer, left.byteOffset, left.byteLength);
  const rightView = new DataView(
    right.buffer,
    right.byteOffset,
    right.byteLength,
  );
  for (let index = 0; index < sharedLength; index += 1) {
    const difference = leftView.getUint8(index) - rightView.getUint8(index);
    if (difference !== 0) return difference;
  }
  return left.length - right.length;
}

function join(left: Uint8Array, right: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(left.length + right.length);
  bytes.set(left);
  bytes.set(right, left.length);
  return bytes;
}

export function hashAllowlistLeaf(bytes: Uint8Array): Uint8Array {
  return sha256(bytes);
}

export function hashAllowlistNode(
  left: Uint8Array,
  right: Uint8Array,
): Uint8Array {
  if (
    left.length !== allowlistHashByteLength ||
    right.length !== allowlistHashByteLength
  ) {
    throw new RangeError("Merkle siblings must be exactly 32 bytes.");
  }
  const [first, second] =
    compareBytes(left, right) <= 0 ? [left, right] : [right, left];
  return sha256(join(first, second));
}

export function calculateAllowlistRoot(
  leafBytes: Uint8Array,
  siblings: readonly Uint8Array[],
  maximumDepth: number,
): Uint8Array {
  if (!Number.isSafeInteger(maximumDepth) || maximumDepth < 1) {
    throw new RangeError("maximumDepth must be a positive safe integer.");
  }
  if (siblings.length === 0 || siblings.length > maximumDepth) {
    throw new RangeError("Merkle proof depth is outside the accepted bounds.");
  }
  return siblings.reduce(hashAllowlistNode, hashAllowlistLeaf(leafBytes));
}
