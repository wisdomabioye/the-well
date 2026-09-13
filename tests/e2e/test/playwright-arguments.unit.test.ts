import { describe, expect, it } from "vitest";

import { normalizePlaywrightArguments } from "../src/playwright-arguments.ts";

describe("normalizePlaywrightArguments", () => {
  it("removes pnpm's separator before forwarding focused arguments", () => {
    expect(
      normalizePlaywrightArguments([
        "--",
        "tests/session.spec.ts",
        "--project=desktop",
      ]),
    ).toEqual(["tests/session.spec.ts", "--project=desktop"]);
  });

  it("preserves direct node invocation arguments", () => {
    expect(normalizePlaywrightArguments(["--project=mobile"])).toEqual([
      "--project=mobile",
    ]);
  });

  it("preserves an empty argument list", () => {
    expect(normalizePlaywrightArguments([])).toEqual([]);
  });
});
