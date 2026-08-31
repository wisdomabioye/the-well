import { integer, text, timestamp } from "drizzle-orm/pg-core";

import { platformSchema } from "../../src/schema/platform.ts";

export const databaseContractFixtures = platformSchema.table(
  "database_contract_fixtures",
  {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),
    externalKey: text("external_key").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export type DatabaseContractFixture =
  typeof databaseContractFixtures.$inferSelect;
export type NewDatabaseContractFixture =
  typeof databaseContractFixtures.$inferInsert;
