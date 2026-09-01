import { z } from "zod";
import { describe, expect, it } from "vitest";

import {
  createOpenApiDocument,
  describeOpenApiOperation,
} from "../src/openapi.ts";
import type { HttpOperation } from "../src/operation.ts";

function operation(
  method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT" = "POST",
  input: "json" | "none" = "json",
  idempotency: "none" | "required" = "required",
): HttpOperation<{ name?: string }, { accepted: boolean }> {
  return {
    applicationErrors: [
      "conflict",
      "forbidden",
      "invalid_request",
      "not_found",
      "unauthorized",
    ],
    execute: async () => ({ ok: true, value: { accepted: true } }),
    idempotency,
    input,
    inputSchema: z.object({ name: z.string().optional() }).strict(),
    method,
    operationId: "createFixture",
    outputSchema: z.object({ accepted: z.boolean() }).strict(),
    path: "/api/v1/fixture",
  };
}

describe("OpenAPI generation", () => {
  it("derives request, response, header, and error contracts", () => {
    const description = describeOpenApiOperation(operation());
    expect(description.method).toBe("post");
    expect(description.operation.operationId).toBe("createFixture");
    expect(description.operation.requestBody).toMatchObject({
      content: {
        "application/json": {
          schema: { properties: { name: { type: "string" } } },
        },
      },
      required: true,
    });
    expect(description.operation.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "x-correlation-id", required: false }),
        expect.objectContaining({ name: "idempotency-key", required: true }),
      ]),
    );
    expect(Object.keys(description.operation.responses).sort()).toEqual([
      "200",
      "400",
      "401",
      "403",
      "404",
      "405",
      "409",
      "500",
    ]);
    expect(description.operation.responses["400"]?.description).toBe(
      "The request boundary rejected the input.",
    );
  });

  it("omits request bodies and idempotency headers when not declared", () => {
    const description = describeOpenApiOperation(
      operation("GET", "none", "none"),
    );
    expect(description.operation.requestBody).toBeUndefined();
    expect(description.operation.parameters).toHaveLength(1);
  });

  it.each([
    ["DELETE", "delete"],
    ["GET", "get"],
    ["PATCH", "patch"],
    ["POST", "post"],
    ["PUT", "put"],
  ] as const)("maps %s operations to OpenAPI", (method, expected) => {
    expect(describeOpenApiOperation(operation(method)).method).toBe(expected);
  });

  it("builds a domain-independent OpenAPI 3.1 document", () => {
    const document = createOpenApiDocument({
      operations: [describeOpenApiOperation(operation("GET"))],
      title: "Fixture API",
      version: "1.0.0",
    });
    expect(document).toMatchObject({
      info: { title: "Fixture API", version: "1.0.0" },
      openapi: "3.1.0",
      paths: {
        "/api/v1/fixture": { get: { operationId: "createFixture" } },
      },
    });
    expect(JSON.stringify(document)).not.toContain("localhost");
  });

  it("rejects duplicate method and path descriptions", () => {
    const description = describeOpenApiOperation(operation("GET"));
    expect(() =>
      createOpenApiDocument({
        operations: [description, description],
        title: "Fixture API",
        version: "1.0.0",
      }),
    ).toThrow("Duplicate OpenAPI operation: GET /api/v1/fixture");
  });
});
