import { beforeEach, describe, expect, it, vi } from "vitest";

const factories = vi.hoisted(() => ({
  authorizationRepository: vi.fn(() => "authorization-repository"),
  authorizationService: vi.fn(() => ({ forPlatform: vi.fn() })),
  client: vi.fn(() => "database-client"),
  environment: vi.fn(() => ({ database: "environment" })),
  pool: vi.fn(() => "database-pool"),
  sessionEnvironment: vi.fn(() => ({ AUTH_SESSION_IDLE_TIMEOUT_MS: 60_000 })),
  sessionRepository: vi.fn(() => "session-repository"),
  sessionService: vi.fn((input: { readonly clock: () => Date }) => {
    input.clock();
    return { find: vi.fn() };
  }),
}));

vi.mock("@ador/auth", () => ({
  createDrizzleSessionRepository: factories.sessionRepository,
  createSessionService: factories.sessionService,
}));
vi.mock("@ador/authorization", () => ({
  createAuthorizationService: factories.authorizationService,
  createDrizzleAuthorizationRepository: factories.authorizationRepository,
}));
vi.mock("@ador/database/connection", () => ({
  createDatabaseClient: factories.client,
  createDatabasePool: factories.pool,
  parseDatabaseEnvironment: factories.environment,
}));
vi.mock("@repo/config/env", () => ({
  parseAuthSessionEnvironment: factories.sessionEnvironment,
}));

describe("page-access runtime composition", () => {
  beforeEach(() => vi.clearAllMocks());

  it("constructs the adapters once with validated configuration", async () => {
    const { getPageAccessDependencies } =
      await import("../src/server/auth/runtime.ts");

    const first = getPageAccessDependencies();
    const second = getPageAccessDependencies();

    expect(second).toBe(first);
    expect(factories.environment).toHaveBeenCalledWith(process.env);
    expect(factories.sessionEnvironment).toHaveBeenCalledWith(process.env);
    expect(factories.pool).toHaveBeenCalledWith({ database: "environment" });
    expect(factories.client).toHaveBeenCalledWith("database-pool");
    expect(factories.sessionRepository).toHaveBeenCalledWith("database-client");
    expect(factories.authorizationRepository).toHaveBeenCalledWith(
      "database-client",
    );
    expect(factories.sessionService).toHaveBeenCalledWith(
      expect.objectContaining({ idleLifetimeMs: 60_000 }),
    );
    expect(factories.authorizationService).toHaveBeenCalledOnce();
  });
});
