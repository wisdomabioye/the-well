import { describe, expect, it } from "vitest";

import {
  httpErrorEnvelopeSchema,
  idempotencyKeySchema,
} from "../src/http/index.js";
import { platformStatusSchema } from "../src/platform/status.js";

const correlationId = "123e4567-e89b-42d3-a456-426614174000";

describe("HTTP contracts", () => {
  it("accepts bounded opaque idempotency keys", () => {
    expect(idempotencyKeySchema.parse("mint.request_123")).toBe(
      "mint.request_123",
    );
    expect(() => idempotencyKeySchema.parse("short")).toThrow();
    expect(() =>
      idempotencyKeySchema.parse("invalid key with spaces"),
    ).toThrow();
  });

  it("keeps errors strict, safe, and correlated", () => {
    expect(
      httpErrorEnvelopeSchema.parse({
        error: {
          code: "invalid_request",
          correlationId,
          message: "Invalid request.",
        },
      }),
    ).toBeDefined();
    expect(() =>
      httpErrorEnvelopeSchema.parse({
        error: {
          code: "invalid_request",
          correlationId,
          message: "Invalid.",
          stack: "secret",
        },
      }),
    ).toThrow();
  });

  it("does not permit an optimistic platform status", () => {
    expect(() =>
      platformStatusSchema.parse({
        apiVersion: "v1",
        registeredFeatures: 1,
        stage: "live",
        transactionalActions: "enabled",
      }),
    ).toThrow();
  });
});
