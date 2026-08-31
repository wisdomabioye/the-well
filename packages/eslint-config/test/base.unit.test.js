import { describe, expect, it } from "vitest";

import { config } from "../base.js";

describe("base ESLint preset", () => {
  it("enables Turbo environment-variable checks", () => {
    const turboConfig = config.find((entry) => entry.plugins?.turbo);

    expect(turboConfig?.rules?.["turbo/no-undeclared-env-vars"]).toBe("warn");
  });
});
