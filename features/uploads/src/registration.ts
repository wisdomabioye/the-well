import { defineFeature } from "@ador/plugin-kit";
import type { ProviderRegistry } from "@ador/plugin-kit/providers";
import { uploadIntentRoutes } from "@ador/shared/uploads";

export function createUploadsFeature(providers: ProviderRegistry) {
  return defineFeature({
    manifest: {
      capabilities: ["api-routes"],
      dependencies: ["accounts"],
      id: "uploads",
      pages: [],
      requiredDecisionGates: [],
      requiredProviderCapabilities: ["object-storage:s3-compatible"],
      routes: [uploadIntentRoutes.complete, uploadIntentRoutes.create],
      version: "1.0.0",
    },
    load: async () =>
      import("@ador/feature-uploads/entrypoint").then(
        ({ createUploadsEntrypoint }) => createUploadsEntrypoint(providers),
      ),
  });
}
