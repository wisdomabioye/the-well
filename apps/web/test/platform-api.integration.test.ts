import { describe, expect, it } from "vitest";

import { httpErrorEnvelopeSchema } from "@ador/shared/http";
import { platformStatusSchema } from "@ador/shared/platform";

import { GET } from "../src/app/api/v1/platform/route.js";

const correlationId = "123e4567-e89b-42d3-a456-426614174000";

describe("Next platform API adapter", () => {
  it("generates a correlation ID when the caller omits one", async () => {
    const response = await GET(
      new Request("http://platform.invalid/api/v1/platform"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-correlation-id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
    );
  });

  it("serves the shared versioned operation", async () => {
    const response = await GET(
      new Request("http://platform.invalid/api/v1/platform", {
        headers: { "x-correlation-id": correlationId },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-correlation-id")).toBe(correlationId);
    expect(platformStatusSchema.parse(await response.json())).toEqual({
      apiVersion: "v1",
      registeredFeatures: 1,
      stage: "foundation",
      transactionalActions: "gated",
    });
  });

  it("returns the shared safe error envelope", async () => {
    const response = await GET(
      new Request("http://platform.invalid/api/v1/platform", {
        headers: { "x-correlation-id": "invalid" },
      }),
    );
    expect(response.status).toBe(400);
    expect(
      httpErrorEnvelopeSchema.parse(await response.json()).error.code,
    ).toBe("invalid_request");
  });
});
