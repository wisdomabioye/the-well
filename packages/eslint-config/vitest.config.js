import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["test/**/*.test.js"] },
  coverage: {
    provider: "v8",
    reporter: ["text", "json-summary", "lcov"],
    include: ["*.js"],
    thresholds: {
      branches: 90.01,
      functions: 90.01,
      lines: 90.01,
      statements: 90.01,
    },
  },
});
