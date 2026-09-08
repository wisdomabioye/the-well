import { randomUUID } from "node:crypto";

import type { RegisteredHttpOperation } from "@ador/http/registered-operation";
import {
  correlationHeaderName,
  idempotencyHeaderName,
} from "@ador/shared/http";

export async function executeNextOperation(
  operation: RegisteredHttpOperation,
  request: Request,
  rawInput: unknown,
): Promise<Response> {
  const response = await operation.execute(
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
