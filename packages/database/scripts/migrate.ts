import { parseDatabaseEnvironment, runMigrations } from "../src/index.ts";

await runMigrations(parseDatabaseEnvironment(process.env));
