import { describe, expect, it } from "vitest";

import { parseObjectKey } from "../src/contracts.ts";
import { ObjectStorageError } from "../src/errors.ts";

describe("parseObjectKey", () => {
  it("accepts a relative, nested exact key", () => {
    expect(parseObjectKey("drafts/account/asset.png")).toBe(
      "drafts/account/asset.png",
    );
  });

  it.each(["", "/absolute", "double//segment", "line\nbreak"])(
    "rejects unsafe key %j",
    (value) => expect(() => parseObjectKey(value)).toThrow(),
  );

  it("rejects keys beyond the S3-compatible length limit", () => {
    expect(() => parseObjectKey("a".repeat(1_025))).toThrow();
  });
});

describe("ObjectStorageError", () => {
  it("retains a stable platform code and causal error", () => {
    const cause = new Error("provider detail");
    const error = new ObjectStorageError(
      "provider-failure",
      "Storage failed.",
      { cause },
    );
    expect(error).toMatchObject({
      code: "provider-failure",
      cause,
      name: "ObjectStorageError",
    });
  });
});
