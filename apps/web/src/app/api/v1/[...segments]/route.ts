import { randomUUID } from "node:crypto";

import {
  correlationHeaderName,
  httpErrorEnvelopeSchema,
} from "@ador/shared/http";
import {
  getOpenApiDocument,
  resolveApiOperation,
} from "../../../../../../../configs/api";
import { executeNextOperation } from "../../../../server/http/next-operation";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ readonly segments: readonly string[] }>;
}

async function handle(request: Request, context: RouteContext) {
  const { segments } = await context.params;
  const path = `/api/v1/${segments.join("/")}`;
  if (request.method === "GET" && path === "/api/v1/openapi") {
    return Response.json(await getOpenApiDocument());
  }
  const operation = await resolveApiOperation(request.method, path);
  if (!operation) {
    const correlationId = randomUUID();
    return Response.json(
      httpErrorEnvelopeSchema.parse({
        error: {
          code: "not_found",
          correlationId,
          message: "Route not found.",
        },
      }),
      { headers: { [correlationHeaderName]: correlationId }, status: 404 },
    );
  }
  const rawInput: unknown =
    request.method === "GET" ? {} : await request.json().catch(() => undefined);
  return executeNextOperation(operation, request, rawInput);
}

export {
  handle as DELETE,
  handle as GET,
  handle as PATCH,
  handle as POST,
  handle as PUT,
};
