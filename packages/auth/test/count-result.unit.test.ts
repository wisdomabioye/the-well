import { describe, expect, it } from "vitest";

import { readAggregateCount } from "../src/passkeys/count-result.ts";

const invalidCases: readonly {
  readonly rows: readonly { readonly count: number }[];
}[] = [
  { rows: [] },
  { rows: [{ count: 1 }, { count: 2 }] },
  { rows: [{ count: -1 }] },
  { rows: [{ count: Number.MAX_SAFE_INTEGER + 1 }] },
  { rows: [{ count: 0.5 }] },
];

describe("database aggregate count boundary", () => {
  it("accepts exactly one non-negative safe integer", () => {
    expect(readAggregateCount([{ count: 0 }])).toBe(0);
  });

  it.each(invalidCases)("rejects invalid aggregate rows", ({ rows }) => {
    expect(() => readAggregateCount(rows)).toThrow(
      "Database aggregate returned an invalid",
    );
  });
});
