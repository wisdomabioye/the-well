import { pgSchema } from "drizzle-orm/pg-core";

export const DATABASE_SCHEMA_NAME = "ador";

export const platformSchema = pgSchema(DATABASE_SCHEMA_NAME);
