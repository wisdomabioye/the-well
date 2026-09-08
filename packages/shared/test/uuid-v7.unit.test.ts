import { describe, expect, it } from "vitest";

import { createUuidV7, uuidV7Schema } from "../src/identifiers/uuid-v7.ts";

describe("UUIDv7 identifiers", () => {
  it("generates identifiers accepted by the authoritative schema", () => {
    const identifier = createUuidV7();

    expect(uuidV7Schema.parse(identifier)).toBe(identifier);
    expect(identifier[14]).toBe("7");
  });

  it.each([
    "not-a-uuid",
    "00000000-0000-4000-8000-000000000000",
    "00000000-0000-7000-0000-000000000000",
  ])("rejects a non-v7 or structurally invalid value: %s", (candidate) => {
    expect(uuidV7Schema.safeParse(candidate).success).toBe(false);
  });
});
