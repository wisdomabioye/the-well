import { drizzle } from "drizzle-orm/node-postgres";

import type { DatabasePool } from "./pool.ts";

export function createDatabaseClient(pool: DatabasePool) {
  return drizzle({ client: pool });
}

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
export type DatabaseTransaction = Parameters<
  Parameters<DatabaseClient["transaction"]>[0]
>[0];
