import type { DatabaseClient } from "@ador/database/connection";
import { authUsers } from "@ador/database/schema/auth";
import { uploadIntents } from "@ador/database/schema/uploads";
import { parseObjectKey } from "@ador/object-storage/contracts";
import { uuidV7Schema } from "@ador/shared/identifiers";
import { and, count, eq, gt } from "drizzle-orm";

import type { UploadIntentRepository } from "../application/repository.ts";

function view(row: typeof uploadIntents.$inferSelect) {
  return {
    byteLength: row.byteLength,
    contentType: row.contentType,
    expiresAt: row.expiresAt,
    id: uuidV7Schema.parse(row.id),
    objectKey: parseObjectKey(row.objectKey),
    purpose: row.purpose,
  };
}

export function createDrizzleUploadIntentRepository(
  database: DatabaseClient,
): UploadIntentRepository {
  return {
    async markSigningFailed({ failedAt, intentId, userId }) {
      await database
        .update(uploadIntents)
        .set({ state: "failed", updatedAt: failedAt })
        .where(
          and(
            eq(uploadIntents.id, intentId),
            eq(uploadIntents.userId, userId),
            eq(uploadIntents.state, "reserved"),
          ),
        );
    },
    async reserve(input) {
      return database.transaction(async (transaction) => {
        await transaction
          .select({ id: authUsers.id })
          .from(authUsers)
          .where(eq(authUsers.id, input.userId))
          .for("update");
        const [existing] = await transaction
          .select()
          .from(uploadIntents)
          .where(
            and(
              eq(uploadIntents.userId, input.userId),
              eq(uploadIntents.idempotencyKey, input.idempotencyKey),
            ),
          )
          .limit(1);
        if (existing !== undefined) {
          if (existing.requestFingerprint !== input.requestFingerprint)
            return { kind: "conflict" };
          if (
            existing.state === "reserved" &&
            existing.expiresAt > input.createdAt
          )
            return { intent: view(existing), kind: "replayed" };
          if (existing.state !== "failed") return { kind: "conflict" };
          const [retried] = await transaction
            .update(uploadIntents)
            .set({
              cleanupEligibleAt: input.cleanupEligibleAt,
              expiresAt: input.expiresAt,
              retainUntil: input.retainUntil,
              state: "reserved",
              updatedAt: input.createdAt,
            })
            .where(eq(uploadIntents.id, existing.id))
            .returning();
          /* v8 ignore next -- PostgreSQL UPDATE RETURNING either throws or returns the matched row. */
          return retried === undefined
            ? { kind: "conflict" }
            : { intent: view(retried), kind: "reserved" };
        }
        const [active] = await transaction
          .select({ value: count() })
          .from(uploadIntents)
          .where(
            and(
              eq(uploadIntents.userId, input.userId),
              eq(uploadIntents.state, "reserved"),
              gt(uploadIntents.expiresAt, input.createdAt),
            ),
          );
        if ((active?.value ?? 0) >= input.activeLimit)
          return { kind: "quota-exceeded" };
        const [inserted] = await transaction
          .insert(uploadIntents)
          .values(input)
          .returning();
        return inserted === undefined
          ? { kind: "conflict" }
          : { intent: view(inserted), kind: "reserved" };
      });
    },
  };
}
