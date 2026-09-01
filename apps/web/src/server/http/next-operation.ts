import { randomUUID } from "node:crypto";

import { executeHttpOperation, type HttpOperation } from "@ador/http";
import {
  correlationHeaderName,
  idempotencyHeaderName,
} from "@ador/shared/http";

export async function executeNextOperation<Input, Output extends object>(
  operation: HttpOperation<Input, Output>,
  request: Request,
  rawInput: unknown,
): Promise<Response> {
  const response = await executeHttpOperation(
    operation,
    {
      headers: {
        [correlationHeaderName]:
          request.headers.get(correlationHeaderName) ?? undefined,
        [idempotencyHeaderName]:
          request.headers.get(idempotencyHeaderName) ?? undefined,
      },
      method: request.method,
      rawInput,
    },
    { createCorrelationId: randomUUID },
  );

  return Response.json(response.body, {
    headers: response.headers,
    status: response.status,
  });
}
