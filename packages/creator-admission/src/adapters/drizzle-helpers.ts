import { createHash } from "node:crypto";

import type { DatabaseTransaction } from "@ador/database/connection";
import {
  creatorAdmissionEvents,
  creatorApplications,
} from "@ador/database/schema/creator-admission";
import type { CreatorAdmissionAction } from "@ador/shared/creator-admission";
import { createUuidV7, uuidV7Schema } from "@ador/shared/identifiers";
import { eq, sql } from "drizzle-orm";

import type {
  CreatorApplicationView,
  CreatorMutationResult,
  MutationContext,
} from "../application/repository.ts";

export function snapshotHash(
  payload: typeof creatorApplications.$inferSelect.draft,
) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function applicationView(
  row: typeof creatorApplications.$inferSelect,
): CreatorApplicationView {
  return {
    applicantUserId: uuidV7Schema.parse(row.applicantUserId),
    draft: row.draft,
    id: uuidV7Schema.parse(row.id),
    revision: row.revision,
    state: row.state,
  };
}

export async function lockedApplication(
  transaction: DatabaseTransaction,
  applicationId: string,
) {
  const [application] = await transaction
    .select()
    .from(creatorApplications)
    .where(eq(creatorApplications.id, applicationId))
    .for("update")
    .limit(1);
  return application;
}

export async function lockApplicant(
  transaction: DatabaseTransaction,
  applicantUserId: string,
): Promise<void> {
  await transaction.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${applicantUserId}, 0))`,
  );
}

export async function replayMutation(
  transaction: DatabaseTransaction,
  input: MutationContext,
  applicationId?: string,
): Promise<CreatorMutationResult | null> {
  const [event] = await transaction
    .select({
      actorUserId: creatorAdmissionEvents.actorUserId,
      applicationId: creatorAdmissionEvents.applicationId,
      requestFingerprint: creatorAdmissionEvents.requestFingerprint,
    })
    .from(creatorAdmissionEvents)
    .where(eq(creatorAdmissionEvents.idempotencyKey, input.idempotencyKey))
    .limit(1);
  if (event === undefined) return null;
  if (
    event.actorUserId !== input.actorUserId ||
    event.requestFingerprint !== input.requestFingerprint ||
    (applicationId !== undefined && event.applicationId !== applicationId)
  ) {
    return { kind: "conflict" };
  }
  const application = await lockedApplication(transaction, event.applicationId);
  return application === undefined
    ? { kind: "conflict" }
    : { application: applicationView(application), kind: "replayed" };
}

export async function insertAdmissionEvent(
  transaction: DatabaseTransaction,
  input: MutationContext & {
    readonly action: CreatorAdmissionAction;
    readonly applicationId: string;
    readonly creatorFeedback?: string;
    readonly evidenceReferences?: readonly string[];
    readonly nextState: typeof creatorApplications.$inferSelect.state;
    readonly previousState: typeof creatorApplications.$inferSelect.state;
    readonly privateNotes?: string;
    readonly reasonCode: string;
    readonly snapshotId?: string;
  },
) {
  await transaction.insert(creatorAdmissionEvents).values({
    action: input.action,
    actorUserId: input.actorUserId,
    applicationId: input.applicationId,
    correlationId: input.correlationId,
    createdAt: input.changedAt,
    creatorFeedback: input.creatorFeedback,
    evidenceReferences: input.evidenceReferences,
    id: createUuidV7(),
    idempotencyKey: input.idempotencyKey,
    nextState: input.nextState,
    policyVersion: input.policyVersion,
    previousState: input.previousState,
    privateNotes: input.privateNotes,
    reasonCode: input.reasonCode,
    requestFingerprint: input.requestFingerprint,
    snapshotId: input.snapshotId,
  });
}
