import type { DatabaseEnvironment } from "../connection/config.ts";
import { resolveMigrationUrl } from "../connection/config.ts";
import { createDatabaseClient } from "../connection/client.ts";
import { createDatabasePool } from "../connection/pool.ts";
import { applyMigrations } from "./apply.ts";

export async function runMigrations(
  environment: DatabaseEnvironment,
): Promise<void> {
  const pool = createDatabasePool(
    environment,
    resolveMigrationUrl(environment),
  );
  try {
    await applyMigrations(createDatabaseClient(pool));
  } finally {
    await pool.end();
  }
}
