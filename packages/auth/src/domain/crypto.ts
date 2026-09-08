import { createHash, randomBytes } from "node:crypto";

export function createOpaqueValue(byteLength: number): string {
  return randomBytes(byteLength).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
