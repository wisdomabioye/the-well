import { describe, expect, it } from "vitest";

import config from "../vitest.config.js";

describe("web coverage inventory", () => {
  it("instruments generic page and API adapters", () => {
    expect(config).toMatchObject({
      test: {
        coverage: {
          include: [
            "src/app/**/page.tsx",
            "src/app/api/v1/**/route.ts",
            "src/server/http/next-operation.ts",
          ],
        },
      },
    });
  });
});
