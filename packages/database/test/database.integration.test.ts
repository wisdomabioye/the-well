import { sql } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  expectTypeOf,
  it,
} from "vitest";

import {
  createDatabaseClient,
  createDatabasePool,
  parseDatabaseEnvironment,
  runMigrations,
} from "../src/index.ts";
import { DATABASE_SCHEMA_NAME } from "../src/schema/platform.ts";
import { databaseContractFixtures } from "./fixtures/schema.ts";
import type {
  DatabaseContractFixture,
  NewDatabaseContractFixture,
} from "./fixtures/schema.ts";

const environment = parseDatabaseEnvironment(process.env);
const pool = createDatabasePool(environment);
const database = createDatabaseClient(pool);

beforeAll(async () => {
  await runMigrations(environment);
  await database.execute(sql`
    create table ${sql.identifier(DATABASE_SCHEMA_NAME)}.${sql.identifier("database_contract_fixtures")} (
      id integer generated always as identity primary key,
      external_key text not null unique,
      created_at timestamptz not null default now()
    )
  `);
});

afterAll(async () => {
  await pool.end();
});

describe("PostgreSQL foundation", () => {
  it("runs against the pinned PostgreSQL major", async () => {
    const result = await pool.query<{ server_version_num: string }>(
      "show server_version_num",
    );

    expect(result.rows[0]?.server_version_num.startsWith("18")).toBe(true);
  });

  it("infers select and insert shapes from the Drizzle table", () => {
    expectTypeOf<NewDatabaseContractFixture>().toEqualTypeOf<{
      externalKey: string;
      createdAt?: Date;
    }>();
    expectTypeOf<DatabaseContractFixture>().toEqualTypeOf<{
      id: number;
      externalKey: string;
      createdAt: Date;
    }>();
  });

  it("applies migrations and returns Drizzle-inferred rows", async () => {
    const inserted = await database
      .insert(databaseContractFixtures)
      .values({ externalKey: "fixture-one" })
      .returning();

    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({ externalKey: "fixture-one" });
    expect(inserted[0]?.createdAt).toBeInstanceOf(Date);
  });

  it("enforces database uniqueness", async () => {
    await database
      .insert(databaseContractFixtures)
      .values({ externalKey: "duplicate" });

    await expect(
      database
        .insert(databaseContractFixtures)
        .values({ externalKey: "duplicate" }),
    ).rejects.toMatchObject({ cause: { code: "23505" } });
  });

  it("rolls back failed transactions", async () => {
    await expect(
      database.transaction(async (transaction) => {
        await transaction
          .insert(databaseContractFixtures)
          .values({ externalKey: "rolled-back" });
        throw new Error("force rollback");
      }),
    ).rejects.toThrow("force rollback");

    const rows = await database
      .select()
      .from(databaseContractFixtures)
      .where(sql`${databaseContractFixtures.externalKey} = ${"rolled-back"}`);
    expect(rows).toEqual([]);
  });
});
