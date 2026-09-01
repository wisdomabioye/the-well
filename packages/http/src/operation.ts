import {
  correlationHeaderName,
  correlationIdSchema,
  httpErrorEnvelopeSchema,
  idempotencyHeaderName,
  idempotencyKeySchema,
  type CorrelationId,
  type HttpErrorCode,
  type HttpErrorEnvelope,
  type HttpMethod,
  type IdempotencyKey,
  type IdempotencyPolicy,
} from "@ador/shared/http";
import type { z } from "zod";

export interface HttpOperationContext {
  readonly correlationId: CorrelationId;
  readonly idempotencyKey?: IdempotencyKey;
}

export type HttpOperationResult<Output extends object> =
  | { readonly ok: true; readonly value: Output }
  | {
      readonly error: Exclude<HttpErrorCode, "internal_error">;
      readonly message: string;
      readonly ok: false;
    };

export interface HttpOperation<Input, Output extends object> {
  readonly execute: (
    input: Input,
    context: HttpOperationContext,
  ) => Promise<HttpOperationResult<Output>>;
  readonly idempotency: IdempotencyPolicy;
  readonly inputSchema: z.ZodType<Input>;
  readonly method: HttpMethod;
  readonly operationId: string;
  readonly outputSchema: z.ZodType<Output>;
  readonly path: `/api/v1/${string}`;
}

export interface HttpAdapterRequest {
  readonly headers: Readonly<Record<string, string | undefined>>;
  readonly method: string;
  /** Untrusted adapter input is validated immediately by the operation schema. */
  readonly rawInput: unknown;
}

export interface HttpAdapterResponse<Output extends object> {
  readonly body: Output | HttpErrorEnvelope;
  readonly headers: Readonly<
    Record<typeof correlationHeaderName, CorrelationId>
  >;
  readonly status: number;
}

export interface HttpExecutionDependencies {
  readonly createCorrelationId: () => string;
}

const errorStatuses: Readonly<Record<HttpErrorCode, number>> = {
  conflict: 409,
  forbidden: 403,
  idempotency_key_required: 400,
  internal_error: 500,
  invalid_request: 400,
  method_not_allowed: 405,
  not_found: 404,
  unauthorized: 401,
};

function errorResponse<Output extends object>(
  code: HttpErrorCode,
  message: string,
  correlationId: CorrelationId,
): HttpAdapterResponse<Output> {
  const publicMessage =
    code === "internal_error" ? "Internal server error." : message;
  return {
    body: httpErrorEnvelopeSchema.parse({
      error: { code, correlationId, message: publicMessage },
    }),
    headers: { [correlationHeaderName]: correlationId },
    status: errorStatuses[code],
  };
}

export async function executeHttpOperation<Input, Output extends object>(
  operation: HttpOperation<Input, Output>,
  request: HttpAdapterRequest,
  dependencies: HttpExecutionDependencies,
): Promise<HttpAdapterResponse<Output>> {
  const generatedCorrelationId = correlationIdSchema.parse(
    dependencies.createCorrelationId(),
  );
  const correlationResult = correlationIdSchema.safeParse(
    request.headers[correlationHeaderName],
  );
  const correlationId = correlationResult.success
    ? correlationResult.data
    : generatedCorrelationId;

  if (
    request.headers[correlationHeaderName] !== undefined &&
    !correlationResult.success
  ) {
    return errorResponse(
      "invalid_request",
      "Invalid correlation ID.",
      correlationId,
    );
  }
  if (request.method !== operation.method) {
    return errorResponse(
      "method_not_allowed",
      "Method not allowed.",
      correlationId,
    );
  }

  const suppliedIdempotencyKey = request.headers[idempotencyHeaderName];
  const idempotencyResult = idempotencyKeySchema.safeParse(
    suppliedIdempotencyKey,
  );
  if (
    operation.idempotency === "required" &&
    suppliedIdempotencyKey === undefined
  ) {
    return errorResponse(
      "idempotency_key_required",
      "A valid idempotency key is required.",
      correlationId,
    );
  }
  if (suppliedIdempotencyKey !== undefined && !idempotencyResult.success) {
    return errorResponse(
      "invalid_request",
      "Invalid idempotency key.",
      correlationId,
    );
  }

  const inputResult = operation.inputSchema.safeParse(request.rawInput);
  if (!inputResult.success) {
    return errorResponse("invalid_request", "Invalid request.", correlationId);
  }

  try {
    const result = await operation.execute(inputResult.data, {
      correlationId,
      ...(idempotencyResult.success
        ? { idempotencyKey: idempotencyResult.data }
        : {}),
    });
    if (!result.ok)
      return errorResponse(result.error, result.message, correlationId);
    const outputResult = operation.outputSchema.safeParse(result.value);
    return outputResult.success
      ? {
          body: outputResult.data,
          headers: { [correlationHeaderName]: correlationId },
          status: 200,
        }
      : errorResponse(
          "internal_error",
          "Internal server error.",
          correlationId,
        );
  } catch {
    return errorResponse(
      "internal_error",
      "Internal server error.",
      correlationId,
    );
  }
}
