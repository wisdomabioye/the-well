import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    coverage: {
      exclude: ["test/**", "vitest.config.ts"],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      thresholds: {
        branches: 90.01,
        functions: 90.01,
        lines: 90.01,
        statements: 90.01,
      },
    },
    projects: [
      {
        test: {
          environment: "jsdom",
          include: ["test/**/*.unit.test.{ts,tsx}"],
          name: "unit",
        },
      },
      {
        test: {
          environment: "jsdom",
          include: ["test/**/*.integration.test.{ts,tsx}"],
          name: "integration",
        },
      },
    ],
  },
});
