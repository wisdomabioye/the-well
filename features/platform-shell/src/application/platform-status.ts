import type { HttpOperation } from "@ador/http";
import {
  platformStatusInputSchema,
  platformStatusSchema,
  type PlatformStatus,
  type PlatformStatusInput,
} from "@ador/shared/platform";

export function createPlatformStatusOperation(
  registeredFeatures: number,
): HttpOperation<PlatformStatusInput, PlatformStatus> {
  return {
    execute: async () => ({
      ok: true,
      value: {
        apiVersion: "v1",
        registeredFeatures,
        stage: "foundation",
        transactionalActions: "gated",
      },
    }),
    idempotency: "none",
    inputSchema: platformStatusInputSchema,
    method: "GET",
    operationId: "getPlatformStatus",
    outputSchema: platformStatusSchema,
    path: "/api/v1/platform",
  };
}
