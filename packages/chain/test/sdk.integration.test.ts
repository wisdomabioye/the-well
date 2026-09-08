import { describe, expect, it } from "vitest";

import { loadAlkanesSdk, qualifiedAlkanesSdk } from "../src/alkanes/runtime.ts";

describe("qualified Alkanes SDK", () => {
  it("loads the immutable root artifact only through the server boundary", async () => {
    const sdk = await loadAlkanesSdk();

    expect(sdk.AlkanesProvider).toBeTypeOf("function");
    expect(qualifiedAlkanesSdk).toEqual({
      artifact:
        "https://pkg.alkanes.build/dist/@alkanes/ts-sdk?v=0.1.6-669e7c0",
      version: "0.1.6-669e7c0",
    });
  });
});
