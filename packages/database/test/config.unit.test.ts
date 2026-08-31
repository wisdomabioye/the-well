import { describe, expect, it } from "vitest";

import {
  parseDatabaseEnvironment,
  resolveMigrationUrl,
} from "../src/connection/config.ts";

const validEnvironment = {
  DATABASE_URL: "postgresql://app:secret@database.invalid/app",
  DATABASE_MIGRATION_URL: "",
  DATABASE_SSL_MODE: "verify-full",
  DATABASE_POOL_MAX: "10",
  DATABASE_ACQUIRE_TIMEOUT_MS: "5000",
  DATABASE_IDLE_TIMEOUT_MS: "30000",
  DATABASE_STATEMENT_TIMEOUT_MS: "15000",
};

describe("database environment", () => {
  it("parses numeric settings and falls back to the runtime URL", () => {
    const parsed = parseDatabaseEnvironment(validEnvironment);

    expect(parsed.DATABASE_POOL_MAX).toBe(10);
    expect(resolveMigrationUrl(parsed)).toBe(validEnvironment.DATABASE_URL);
  });

  it("uses a separate privileged migration URL when supplied", () => {
    const parsed = parseDatabaseEnvironment({
      ...validEnvironment,
      DATABASE_MIGRATION_URL:
        "postgresql://migrator:secret@database.invalid/app",
    });

    expect(resolveMigrationUrl(parsed)).toBe(parsed.DATABASE_MIGRATION_URL);
  });

  it("accepts the minimum positive pool size", () => {
    expect(
      parseDatabaseEnvironment({
        ...validEnvironment,
        DATABASE_POOL_MAX: "1",
      }).DATABASE_POOL_MAX,
    ).toBe(1);
  });

  it.each([
    ["non-PostgreSQL URL", { DATABASE_URL: "https://database.invalid" }],
    ["zero pool size", { DATABASE_POOL_MAX: "0" }],
    ["unknown TLS mode", { DATABASE_SSL_MODE: "prefer" }],
  ])("rejects %s", (_caseName, override) => {
    expect(() =>
      parseDatabaseEnvironment({ ...validEnvironment, ...override }),
    ).toThrow();
  });
});
