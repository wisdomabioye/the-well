import type { WalletTestEnvironment } from "./contracts.ts";

export function matrixKey(parts: readonly string[]): string {
  return JSON.stringify(parts);
}

export function environmentParts(
  environment: WalletTestEnvironment,
): readonly string[] {
  return [
    environment.browser.name,
    environment.browser.version,
    environment.device.category,
    environment.device.os,
  ];
}
