import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:4173";
const repositoryRoot = resolve(import.meta.dirname, "../..");
const serverPort = new URL(baseURL).port;

if (!serverPort) {
  throw new Error("E2E_BASE_URL must include an explicit port.");
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm --filter web start:standalone",
    cwd: repositoryRoot,
    env: { HOSTNAME: "127.0.0.1", PORT: serverPort },
    reuseExistingServer: false,
    url: baseURL,
  },
});
