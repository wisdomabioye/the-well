import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:5432/test";
  process.env.DATABASE_SSL_MODE = "disable";
  process.env.DATABASE_POOL_MAX = "1";
  process.env.DATABASE_ACQUIRE_TIMEOUT_MS = "1000";
  process.env.DATABASE_IDLE_TIMEOUT_MS = "1000";
  process.env.DATABASE_STATEMENT_TIMEOUT_MS = "1000";
});

describe("creator admission runtime", () => {
  it("constructs and reuses one process-local service", async () => {
    const { getCreatorAdmissionService } = await import("../src/runtime.ts");
    const first = getCreatorAdmissionService();
    expect(getCreatorAdmissionService()).toBe(first);
  });
});
