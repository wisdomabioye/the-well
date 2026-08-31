import { describe, expect, it } from "vitest";

import { nextJsConfig } from "../next.js";
import { config as reactConfig } from "../react-internal.js";

describe("framework ESLint presets", () => {
  it("includes Next core-web-vitals rules", () => {
    const nextRules = nextJsConfig.flatMap((entry) =>
      entry.rules ? Object.keys(entry.rules) : [],
    );

    expect(nextRules).toContain("@next/next/no-img-element");
  });

  it("includes browser globals for React packages", () => {
    const browserConfig = reactConfig.find((entry) =>
      Object.hasOwn(entry.languageOptions?.globals ?? {}, "window"),
    );

    expect(browserConfig).toBeDefined();
  });
});
