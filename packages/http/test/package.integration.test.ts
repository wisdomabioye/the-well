import { describe, expect, it } from "vitest";

describe("HTTP package boundary", () => {
  it("loads without a delivery framework", async () => {
    const module = await import("@ador/http");
    expect(module.executeHttpOperation).toBeTypeOf("function");
  });
});
