import { defineProvider } from "@ador/plugin-kit/providers";

export const r2ObjectStorageProvider = defineProvider({
  manifest: {
    capabilities: ["object-storage:s3-compatible"],
    id: "r2-object-storage",
    requiredDecisionGates: [],
    version: "1.0.0",
  },
  load: async () =>
    import("./provider-entrypoint.ts").then(
      ({ r2ObjectStorageProviderEntrypoint }) =>
        r2ObjectStorageProviderEntrypoint,
    ),
});
