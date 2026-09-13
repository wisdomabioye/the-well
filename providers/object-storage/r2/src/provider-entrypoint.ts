import type { ProviderEntrypoint } from "@ador/plugin-kit/providers";

export const r2ObjectStorageProviderEntrypoint = {
  capabilities: ["object-storage:s3-compatible"],
  id: "r2-object-storage",
  version: "1.0.0",
} as const satisfies ProviderEntrypoint;
