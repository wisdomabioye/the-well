import type { HttpOperation } from "@ador/http";
import {
  completeUploadIntentInputSchema,
  completedUploadResponseSchema,
  uploadIntentRoutes,
  type CompleteUploadIntentInput,
  type CompletedUploadResponse,
} from "@ador/shared/uploads";
import type { createUploadIntentService } from "@ador/uploads";

type Service = ReturnType<typeof createUploadIntentService>;

export function createCompleteUploadIntentOperation(
  getService: () => Promise<Service>,
) {
  return {
    access: { kind: "authenticated" },
    applicationErrors: [
      "conflict",
      "invalid_request",
      "not_found",
      "unauthorized",
    ],
    execute: async (input, context) => {
      if (context.actorUserId === null) {
        return {
          error: "unauthorized",
          message: "Authentication is required.",
          ok: false,
        } as const;
      }
      const result = await (
        await getService()
      ).complete(input, {
        correlationId: context.correlationId,
        userId: context.actorUserId,
      });
      if (result.kind === "unavailable")
        return {
          error: "not_found",
          message: "The upload intent is not available.",
          ok: false,
        } as const;
      if (result.kind === "missing-object")
        return {
          error: "conflict",
          message: "The uploaded object is not available yet.",
          ok: false,
        } as const;
      if (result.kind === "invalid-object")
        return {
          error: "invalid_request",
          message: "The uploaded object does not match the upload intent.",
          ok: false,
        } as const;
      return { ok: true, value: { asset: result.asset } } as const;
    },
    idempotency: "none",
    input: "json",
    inputSchema: completeUploadIntentInputSchema,
    outputSchema: completedUploadResponseSchema,
    ...uploadIntentRoutes.complete,
  } satisfies HttpOperation<CompleteUploadIntentInput, CompletedUploadResponse>;
}
