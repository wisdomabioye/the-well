import { createHash } from "node:crypto";
import { spawn } from "node:child_process";

import {
  applyMigrations,
  authSessions,
  authUsers,
  createDatabaseClient,
  createDatabasePool,
  platformRoleAssignments,
} from "@ador/database";
import { withDisposablePostgres } from "../../../packages/database/test/support/postgres-container.ts";

import { creatorE2EFixtures } from "../src/creator-fixtures.ts";
import { resolveE2EServerConfig } from "../src/server-config.ts";

function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function seed(databaseUrl: string): Promise<void> {
  const pool = createDatabasePool({
    DATABASE_ACQUIRE_TIMEOUT_MS: 5_000,
    DATABASE_IDLE_TIMEOUT_MS: 1_000,
    DATABASE_POOL_MAX: 4,
    DATABASE_SSL_MODE: "disable",
    DATABASE_STATEMENT_TIMEOUT_MS: 5_000,
    DATABASE_URL: databaseUrl,
  });
  try {
    const database = createDatabaseClient(pool);
    await applyMigrations(database);
    const expiry = new Date("2099-01-01T00:00:00.000Z");
    await database.insert(authUsers).values([
      {
        email: "applicant@example.test",
        emailVerified: true,
        id: creatorE2EFixtures.applicant.userId,
        name: "E2E Applicant",
      },
      {
        email: "reviewer@example.test",
        emailVerified: true,
        id: creatorE2EFixtures.reviewer.userId,
        name: "E2E Reviewer",
      },
    ]);
    await database.insert(authSessions).values([
      {
        absoluteExpiresAt: expiry,
        id: creatorE2EFixtures.applicant.sessionId,
        idleExpiresAt: expiry,
        tokenHash: hash(creatorE2EFixtures.applicant.sessionToken),
        userId: creatorE2EFixtures.applicant.userId,
      },
      {
        absoluteExpiresAt: expiry,
        id: creatorE2EFixtures.reviewer.sessionId,
        idleExpiresAt: expiry,
        tokenHash: hash(creatorE2EFixtures.reviewer.sessionToken),
        userId: creatorE2EFixtures.reviewer.userId,
      },
    ]);
    await database.insert(platformRoleAssignments).values({
      id: creatorE2EFixtures.reviewer.roleId,
      role: "reviewer",
      status: "active",
      userId: creatorE2EFixtures.reviewer.userId,
    });
  } finally {
    await pool.end();
  }
}

async function runPlaywright(databaseUrl: string): Promise<void> {
  await seed(databaseUrl);
  const { baseURL } = resolveE2EServerConfig(process.env.E2E_BASE_URL);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      "pnpm",
      ["exec", "playwright", "test", ...process.argv.slice(2)],
      {
        env: {
          ...process.env,
          APP_ENV: "test",
          AUTH_SESSION_IDLE_TIMEOUT_MS: "86400000",
          DATABASE_ACQUIRE_TIMEOUT_MS: "5000",
          DATABASE_IDLE_TIMEOUT_MS: "1000",
          DATABASE_MIGRATION_URL: "",
          DATABASE_POOL_MAX: "4",
          DATABASE_SSL_MODE: "disable",
          DATABASE_STATEMENT_TIMEOUT_MS: "5000",
          DATABASE_URL: databaseUrl,
          NEXT_PUBLIC_APP_NAME: "Adorbitals E2E",
          PUBLIC_BASE_URL: baseURL,
        },
        stdio: "inherit",
      },
    );
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Playwright exited with code ${String(code)}`));
    });
  });
}

await withDisposablePostgres(runPlaywright);
