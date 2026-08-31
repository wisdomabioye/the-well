import { describe, expect, it } from "vitest";

import { parseEnvironment } from "../src/env/runtime.ts";

const validEnvironment = {
  APP_ENV: "test",
  PUBLIC_BASE_URL: "http://127.0.0.1:3000",
  NEXT_PUBLIC_APP_NAME: "Adorbitals",
};

describe("parseEnvironment", () => {
  it("returns a typed environment for valid input", () => {
    expect(parseEnvironment(validEnvironment)).toEqual(validEnvironment);
  });

  it("rejects a missing public application name", () => {
    expect(() =>
      parseEnvironment({ ...validEnvironment, NEXT_PUBLIC_APP_NAME: "" }),
    ).toThrow();
  });

  it("rejects an unsupported environment", () => {
    expect(() =>
      parseEnvironment({ ...validEnvironment, APP_ENV: "staging" }),
    ).toThrow();
  });
});
