import { z } from "zod";

const positiveInteger = z.coerce.number().int().positive();

export const databaseEnvironmentSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  DATABASE_MIGRATION_URL: z
    .union([z.literal(""), z.url({ protocol: /^postgres(ql)?$/ })])
    .optional(),
  DATABASE_SSL_MODE: z.enum(["disable", "require", "verify-full"]),
  DATABASE_POOL_MAX: positiveInteger,
  DATABASE_ACQUIRE_TIMEOUT_MS: positiveInteger,
  DATABASE_IDLE_TIMEOUT_MS: positiveInteger,
  DATABASE_STATEMENT_TIMEOUT_MS: positiveInteger,
});

export type DatabaseEnvironment = z.infer<typeof databaseEnvironmentSchema>;

export function parseDatabaseEnvironment(
  source: NodeJS.ProcessEnv,
): DatabaseEnvironment {
  return databaseEnvironmentSchema.parse({
    DATABASE_URL: source.DATABASE_URL,
    DATABASE_MIGRATION_URL: source.DATABASE_MIGRATION_URL,
    DATABASE_SSL_MODE: source.DATABASE_SSL_MODE,
    DATABASE_POOL_MAX: source.DATABASE_POOL_MAX,
    DATABASE_ACQUIRE_TIMEOUT_MS: source.DATABASE_ACQUIRE_TIMEOUT_MS,
    DATABASE_IDLE_TIMEOUT_MS: source.DATABASE_IDLE_TIMEOUT_MS,
    DATABASE_STATEMENT_TIMEOUT_MS: source.DATABASE_STATEMENT_TIMEOUT_MS,
  });
}

export function resolveMigrationUrl(environment: DatabaseEnvironment): string {
  return environment.DATABASE_MIGRATION_URL || environment.DATABASE_URL;
}
