import { registerHttpOperation } from "@ador/http/registered-operation";
import type { FeatureEntrypoint } from "@ador/plugin-kit";
import type { ProviderRegistry } from "@ador/plugin-kit/providers";

import { createUploadIntentOperation } from "./application/operation.ts";
import { createCompleteUploadIntentOperation } from "./application/completion-operation.ts";
import { createUploadServiceResolver } from "./runtime.ts";

export function createUploadsEntrypoint(
  providers: ProviderRegistry,
): FeatureEntrypoint {
  const resolveService = createUploadServiceResolver(providers);
  return {
    capabilities: ["api-routes"],
    id: "uploads",
    operations: [
      registerHttpOperation(
        createCompleteUploadIntentOperation(resolveService),
      ),
      registerHttpOperation(createUploadIntentOperation(resolveService)),
    ],
    version: "1.0.0",
  };
}
