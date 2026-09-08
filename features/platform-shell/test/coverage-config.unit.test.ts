import { describe, expect, it } from "vitest";

import config from "../vitest.config.js";

describe("platform shell coverage inventory", () => {
  it("instruments TypeScript and TSX feature sources", () => {
    expect(config).toMatchObject({
      test: {
        coverage: { include: ["src/**/*.{ts,tsx}"] },
      },
    });
  });
});
