import { getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, expectTypeOf, it } from "vitest";

import { authUsers, type UploadIntent, uploadIntents } from "../src/index.ts";

describe("upload-intent schema", () => {
  it("owns authorization, lifecycle, idempotency, and quota lookup evidence", () => {
    const config = getTableConfig(uploadIntents);
    expect(
      config.foreignKeys.map((key) =>
        getTableName(key.reference().foreignTable),
      ),
    ).toEqual([getTableName(authUsers)]);
    expect(config.indexes.map(({ config: index }) => index.name)).toEqual(
      expect.arrayContaining([
        "upload_intents_user_idempotency_unique",
        "upload_intents_active_user_idx",
      ]),
    );
    expect(config.checks.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        "upload_intents_byte_length_positive",
        "upload_intents_fingerprint_sha256",
        "upload_intents_cleanup_after_expiry",
        "upload_intents_retention_after_cleanup",
      ]),
    );
  });

  it("infers persistence fields from the Drizzle table", () => {
    expectTypeOf<UploadIntent["byteLength"]>().toEqualTypeOf<number>();
    expectTypeOf<UploadIntent["state"]>().toEqualTypeOf<
      "reserved" | "completed" | "cancelled" | "failed"
    >();
  });
});
