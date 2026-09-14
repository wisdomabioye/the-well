import { registerHttpOperation } from "@ador/http/registered-operation";
import type { FeatureEntrypoint } from "@ador/plugin-kit";
import type { ProviderRegistry } from "@ador/plugin-kit/providers";

import { createUploadIntentOperation } from "./application/operation.ts";
import { createUploadServiceResolver } from "./runtime.ts";

export function createUploadsEntrypoint(
  providers: ProviderRegistry,
): FeatureEntrypoint {
  return {
    capabilities: ["api-routes"],
    id: "uploads",
    operations: [
      registerHttpOperation(
        createUploadIntentOperation(createUploadServiceResolver(providers)),
      ),
    ],
    version: "1.0.0",
  };
}
