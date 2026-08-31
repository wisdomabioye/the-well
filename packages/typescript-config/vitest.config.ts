import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["test/**/*.test.ts"] },
  coverage: {
    provider: "v8",
    reporter: ["text", "json-summary", "lcov"],
    include: ["src/**/*.ts"],
    thresholds: {
      branches: 90.01,
      functions: 90.01,
      lines: 90.01,
      statements: 90.01,
    },
  },
});
