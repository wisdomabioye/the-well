import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

import { resolveE2EServerConfig } from "./src/server-config.ts";

const { baseURL, port: serverPort } = resolveE2EServerConfig(
  process.env.E2E_BASE_URL,
);
const repositoryRoot = resolve(import.meta.dirname, "../..");

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
