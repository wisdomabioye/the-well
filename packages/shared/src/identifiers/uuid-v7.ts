import { z } from "zod";

declare const uuidV7Brand: unique symbol;

export type UuidV7 = string & { readonly [uuidV7Brand]: true };

const uuidV7Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export const uuidV7TextSchema = z
  .string()
  .regex(uuidV7Pattern, "Expected UUIDv7");

export const uuidV7Schema = uuidV7TextSchema.transform(
  (value) => value as UuidV7,
);

function hexadecimal(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function createUuidV7(): UuidV7 {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let milliseconds = BigInt(Date.now());
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = Number(milliseconds & 0xffn);
    milliseconds >>= 8n;
  }
  bytes[6] = ((bytes.at(6) ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes.at(8) ?? 0) & 0x3f) | 0x80;
  const value = hexadecimal(bytes);
  return uuidV7Schema.parse(
    `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`,
  );
}
