import { describe, expect, it } from "vitest";

import { GET } from "../src/app/api/v1/[...segments]/route.js";

const request = new Request("http://platform.invalid/api/v1/openapi");
const context = { params: Promise.resolve({ segments: ["openapi"] }) };

describe("OpenAPI document adapter", () => {
  it("serves the generated platform contract without a configured domain", async () => {
    const response = await GET(request, context);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      info: { title: "The Well API", version: "1.0.0" },
      openapi: "3.1.0",
      paths: {
        "/api/v1/platform": {
          get: {
            operationId: "getPlatformStatus",
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: {
                      properties: {
                        transactionalActions: { const: "gated" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    expect(
      JSON.stringify(await (await GET(request, context)).json()),
    ).not.toContain("servers");
  });
});
