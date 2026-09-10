import { describe, expect, it } from "vitest";

import { resolveE2EServerConfig } from "../src/server-config.ts";

describe("E2E server configuration", () => {
  it("uses the isolated default server", () => {
    expect(resolveE2EServerConfig()).toEqual({
      baseURL: "http://localhost:4173",
      port: "4173",
    });
  });

  it.each(["https://example.test", "ftp://example.test:4173"])(
    "rejects an unusable server URL: %s",
    (baseURL) => {
      expect(() => resolveE2EServerConfig(baseURL)).toThrow();
    },
  );
});
