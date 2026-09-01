import { z } from "zod";
import { describe, expect, it, vi } from "vitest";

import {
  executeHttpOperation,
  type HttpOperation,
  type HttpOperationContext,
} from "../src/operation.ts";

const generatedCorrelationId = "123e4567-e89b-42d3-a456-426614174000";
const suppliedCorrelationId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
const outputSchema = z.object({ message: z.string() }).strict();
type TestOperation = HttpOperation<{ name: string }, { message: string }>;

function operation(
  execute: TestOperation["execute"] = async () => ({
    ok: true,
    value: { message: "ready" },
  }),
  idempotency: "none" | "required" = "none",
): TestOperation {
  return {
    execute,
    idempotency,
    inputSchema: z.object({ name: z.string() }).strict(),
    method: "POST",
    operationId: "testOperation",
    outputSchema,
    path: "/api/v1/test",
  };
}

function request(overrides: object = {}) {
  return {
    headers: {},
    method: "POST",
    rawInput: { name: "Ada" },
    ...overrides,
  };
}

const dependencies = { createCorrelationId: () => generatedCorrelationId };

describe("executeHttpOperation", () => {
  it("validates input and returns a correlated success", async () => {
    const execute = vi.fn(
      async (_input: { name: string }, context: HttpOperationContext) => ({
        ok: true as const,
        value: { message: context.idempotencyKey ?? "ready" },
      }),
    );
    const response = await executeHttpOperation(
      operation(execute, "required"),
      request({
        headers: {
          "idempotency-key": "request-key-1234",
          "x-correlation-id": suppliedCorrelationId,
        },
      }),
      dependencies,
    );

    expect(response).toEqual({
      body: { message: "request-key-1234" },
      headers: { "x-correlation-id": suppliedCorrelationId },
      status: 200,
    });
    expect(execute).toHaveBeenCalledWith(
      { name: "Ada" },
      {
        correlationId: suppliedCorrelationId,
        idempotencyKey: "request-key-1234",
      },
    );
  });

  it.each([
    [
      "invalid correlation ID",
      request({ headers: { "x-correlation-id": "not-a-uuid" } }),
      "invalid_request",
      400,
    ],
    ["wrong method", request({ method: "GET" }), "method_not_allowed", 405],
    ["invalid input", request({ rawInput: {} }), "invalid_request", 400],
  ] as const)("rejects %s", async (_caseName, adapterRequest, code, status) => {
    const response = await executeHttpOperation(
      operation(),
      adapterRequest,
      dependencies,
    );
    expect(response).toMatchObject({
      body: { error: { code, correlationId: generatedCorrelationId } },
      status,
    });
  });

  it("requires a valid idempotency key when declared", async () => {
    const response = await executeHttpOperation(
      operation(undefined, "required"),
      request(),
      dependencies,
    );
    expect(response).toMatchObject({
      body: { error: { code: "idempotency_key_required" } },
      status: 400,
    });
  });

  it("rejects a supplied invalid idempotency key", async () => {
    const execute = vi.fn(operation().execute);
    const response = await executeHttpOperation(
      operation(execute),
      request({ headers: { "idempotency-key": "bad key" } }),
      dependencies,
    );
    expect(response).toMatchObject({
      body: { error: { code: "invalid_request" } },
      status: 400,
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it("maps typed application failures", async () => {
    const response = await executeHttpOperation(
      operation(async () => ({
        error: "conflict",
        message: "Already exists.",
        ok: false,
      })),
      request(),
      dependencies,
    );
    expect(response).toMatchObject({
      body: { error: { code: "conflict" } },
      status: 409,
    });
  });

  it("maps invalid application output to a safe internal error", async () => {
    const invalidOutputOperation: HttpOperation<{ name: string }, object> = {
      ...operation(),
      execute: async () => ({ ok: true, value: { message: 3 } }),
      outputSchema,
    };
    const response = await executeHttpOperation(
      invalidOutputOperation,
      request(),
      dependencies,
    );
    expect(response).toMatchObject({
      body: {
        error: { code: "internal_error", message: "Internal server error." },
      },
      status: 500,
    });
  });

  it("maps unexpected exceptions to a safe internal error", async () => {
    const response = await executeHttpOperation(
      operation(async () => Promise.reject(new Error("private failure"))),
      request(),
      dependencies,
    );
    expect(response).toMatchObject({
      body: {
        error: { code: "internal_error", message: "Internal server error." },
      },
      status: 500,
    });
    expect(JSON.stringify(response.body)).not.toContain("private failure");
  });

  it("fails fast when the adapter generates an invalid correlation ID", async () => {
    await expect(
      executeHttpOperation(operation(), request(), {
        createCorrelationId: () => "invalid",
      }),
    ).rejects.toThrow();
  });
});
