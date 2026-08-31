import { resolve } from "node:path";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import type { DatabaseClient } from "../connection/client.ts";

export const migrationsDirectory = resolve(
  import.meta.dirname,
  "../../migrations",
);

export async function applyMigrations(
  database: DatabaseClient,
  directory = migrationsDirectory,
): Promise<void> {
  await migrate(database, { migrationsFolder: directory });
}
