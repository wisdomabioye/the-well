import { describe, expect, it } from "vitest";

import config from "../playwright.config.ts";

describe("Playwright production-server integration", () => {
  it("starts the standalone web app on the configured origin", () => {
    expect(config.use?.baseURL).toBe("http://localhost:4173");
    expect(config.webServer).toMatchObject({
      command: "pnpm --filter web start:standalone",
      env: { HOSTNAME: "127.0.0.1", PORT: "4173" },
      url: "http://localhost:4173",
    });
  });
});
