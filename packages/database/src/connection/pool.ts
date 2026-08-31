import { Pool, type PoolConfig } from "pg";

import type { DatabaseEnvironment } from "./config.ts";

export type DatabasePool = Pool;

export function toPoolConfig(
  environment: DatabaseEnvironment,
  connectionString = environment.DATABASE_URL,
): PoolConfig {
  const ssl =
    environment.DATABASE_SSL_MODE === "disable"
      ? false
      : {
          rejectUnauthorized: environment.DATABASE_SSL_MODE === "verify-full",
        };

  return {
    connectionString,
    connectionTimeoutMillis: environment.DATABASE_ACQUIRE_TIMEOUT_MS,
    idleTimeoutMillis: environment.DATABASE_IDLE_TIMEOUT_MS,
    max: environment.DATABASE_POOL_MAX,
    ssl,
    statement_timeout: environment.DATABASE_STATEMENT_TIMEOUT_MS,
  };
}

export function createDatabasePool(
  environment: DatabaseEnvironment,
  connectionString?: string,
): DatabasePool {
  return new Pool(toPoolConfig(environment, connectionString));
}
