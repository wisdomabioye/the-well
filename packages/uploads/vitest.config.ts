import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      thresholds: { branches: 90, functions: 90, lines: 90, statements: 90 },
    },
    projects: [
      { test: { include: ["test/**/*.unit.test.ts"], name: "unit" } },
      {
        test: {
          include: ["test/**/*.integration.test.ts"],
          name: "integration",
        },
      },
    ],
  },
});
