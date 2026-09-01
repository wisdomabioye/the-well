import { describe, expect, it } from "vitest";

import { nextJsConfig } from "../next.js";
import { config as reactConfig } from "../react-internal.js";

describe("framework ESLint presets", () => {
  it("includes Next core-web-vitals rules", () => {
    const nextRules = Object.assign(
      {},
      ...nextJsConfig.map((entry) => entry.rules ?? {}),
    );

    expect(nextRules["@next/next/no-html-link-for-pages"]).toBe("error");
    expect(nextRules["@next/next/no-sync-scripts"]).toBe("error");
  });

  it("includes browser globals for React packages", () => {
    const browserConfig = reactConfig.find((entry) => {
      const globals = entry.languageOptions?.globals;
      return (
        typeof globals === "object" && globals !== null && "window" in globals
      );
    });

    expect(browserConfig).toBeDefined();
  });
});
