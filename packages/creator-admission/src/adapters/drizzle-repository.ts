import type { DatabaseClient } from "@ador/database/connection";
import {
  creatorApplications,
  creatorApplicationSnapshots,
} from "@ador/database/schema/creator-admission";
import { authUsers } from "@ador/database/schema/auth";
import { platformRoleAssignments } from "@ador/database/schema/accounts";
import {
  creatorApplicationSubmissionSchema,
  resolveCreatorAdmissionTransition,
} from "@ador/shared/creator-admission";
import { createUuidV7 } from "@ador/shared/identifiers";
import { and, desc, eq, inArray } from "drizzle-orm";

import type { CreatorAdmissionRepository } from "../application/repository.ts";
import {
  applicationView,
  insertAdmissionEvent,
  lockApplicant,
  lockedApplication,
  replayMutation,
  snapshotHash,
} from "./drizzle-helpers.ts";
const applicantDraftReason = "applicant-saved-draft";
const applicantSubmissionReason = "applicant-submitted";

export function createDrizzleCreatorAdmissionRepository(
  database: DatabaseClient,
): CreatorAdmissionRepository {
  return {
    async findForApplicant(applicantUserId) {
      const [application] = await database
        .select()
        .from(creatorApplications)
        .where(eq(creatorApplications.applicantUserId, applicantUserId))
        .limit(1);
      return application === undefined ? null : applicationView(application);
    },

    async saveDraft(input) {
      return database.transaction(async (transaction) => {
        const repeated = await replayMutation(transaction, input);
        if (repeated !== null) return repeated;
        await lockApplicant(transaction, input.actorUserId);
        const serializedReplay = await replayMutation(transaction, input);
        if (serializedReplay !== null) return serializedReplay;
        const [existing] = await transaction
          .select()
          .from(creatorApplications)
          .where(eq(creatorApplications.applicantUserId, input.actorUserId))
          .for("update")
          .limit(1);
        if (
          existing !== undefined &&
          !["draft", "changes-requested"].includes(existing.state)
        ) {
          return { kind: "conflict" };
        }
        const previousState = existing?.state ?? "draft";
        const nextRevision = (existing?.revision ?? 0) + 1;
        const [saved] =
          existing === undefined
            ? await transaction
                .insert(creatorApplications)
                .values({
                  applicantUserId: input.actorUserId,
                  createdAt: input.changedAt,
                  draft: input.draft,
                  id: input.applicationId,
                  revision: nextRevision,
                  updatedAt: input.changedAt,
                })
                .returning()
            : await transaction
                .update(creatorApplications)
                .set({
                  draft: input.draft,
                  revision: nextRevision,
                  updatedAt: input.changedAt,
                })
                .where(eq(creatorApplications.id, existing.id))
                .returning();
        if (saved === undefined) return { kind: "conflict" };
        await insertAdmissionEvent(transaction, {
          ...input,
          action: "save-draft",
          applicationId: saved.id,
          nextState: saved.state,
          previousState,
          reasonCode: applicantDraftReason,
        });
        return { application: applicationView(saved), kind: "changed" };
      });
    },

    async submit(input) {
      return database.transaction(async (transaction) => {
        const repeated = await replayMutation(transaction, input);
        if (repeated !== null) return repeated;
        const [application] = await transaction
          .select()
          .from(creatorApplications)
          .where(eq(creatorApplications.applicantUserId, input.actorUserId))
          .for("update")
          .limit(1);
        if (application === undefined) return { kind: "not-found" };
        const serializedReplay = await replayMutation(
          transaction,
          input,
          application.id,
        );
        if (serializedReplay !== null) return serializedReplay;
        const snapshotPayload = creatorApplicationSubmissionSchema.parse(
          application.draft,
        );
        const action = application.state === "draft" ? "submit" : "resubmit";
        const nextState = resolveCreatorAdmissionTransition(
          application.state,
          action,
        );
        if (nextState === null) return { kind: "conflict" };
        const [identity] = await transaction
          .select({
            email: authUsers.email,
            emailVerified: authUsers.emailVerified,
          })
          .from(authUsers)
          .where(eq(authUsers.id, input.actorUserId))
          .limit(1);
        if (identity?.emailVerified !== true)
          return { kind: "contact-unverified" };
        const [latest] = await transaction
          .select({ sequence: creatorApplicationSnapshots.sequence })
          .from(creatorApplicationSnapshots)
          .where(eq(creatorApplicationSnapshots.applicationId, application.id))
          .orderBy(desc(creatorApplicationSnapshots.sequence))
          .limit(1);
        const snapshotId = createUuidV7();
        await transaction.insert(creatorApplicationSnapshots).values({
          applicationId: application.id,
          createdAt: input.changedAt,
          id: snapshotId,
          payload: snapshotPayload,
          payloadHash: snapshotHash(snapshotPayload),
          schemaVersion: input.schemaVersion,
          sequence: (latest?.sequence ?? 0) + 1,
          submittedByUserId: input.actorUserId,
          verifiedContactEmail: identity.email,
        });
        const [saved] = await transaction
          .update(creatorApplications)
          .set({ state: nextState, updatedAt: input.changedAt })
          .where(eq(creatorApplications.id, application.id))
          .returning();
        if (saved === undefined) return { kind: "conflict" };
        await insertAdmissionEvent(transaction, {
          ...input,
          action,
          applicationId: application.id,
          nextState,
          previousState: application.state,
          reasonCode: applicantSubmissionReason,
          snapshotId,
        });
        return { application: applicationView(saved), kind: "changed" };
      });
    },

    async review(input) {
      return database.transaction(async (transaction) => {
        const repeated = await replayMutation(
          transaction,
          input,
          input.applicationId,
        );
        if (repeated !== null) return repeated;
        const application = await lockedApplication(
          transaction,
          input.applicationId,
        );
        if (application === undefined) return { kind: "not-found" };
        const serializedReplay = await replayMutation(
          transaction,
          input,
          application.id,
        );
        if (serializedReplay !== null) return serializedReplay;
        if (application.applicantUserId === input.actorUserId)
          return { kind: "forbidden" };
        if (input.allowedReviewerRoles.length === 0)
          return { kind: "forbidden" };
        const [assignment] = await transaction
          .select({ id: platformRoleAssignments.id })
          .from(platformRoleAssignments)
          .where(
            and(
              eq(platformRoleAssignments.userId, input.actorUserId),
              eq(platformRoleAssignments.status, "active"),
              inArray(platformRoleAssignments.role, [
                ...input.allowedReviewerRoles,
              ]),
            ),
          )
          .limit(1);
        if (assignment === undefined) return { kind: "forbidden" };
        const nextState = resolveCreatorAdmissionTransition(
          application.state,
          input.action,
        );
        if (nextState === null) return { kind: "conflict" };
        const [latest] = await transaction
          .select({ id: creatorApplicationSnapshots.id })
          .from(creatorApplicationSnapshots)
          .where(eq(creatorApplicationSnapshots.applicationId, application.id))
          .orderBy(desc(creatorApplicationSnapshots.sequence))
          .limit(1);
        if (latest === undefined) return { kind: "conflict" };
        if (input.action === "approve") {
          const [identity] = await transaction
            .select({ emailVerified: authUsers.emailVerified })
            .from(authUsers)
            .where(eq(authUsers.id, application.applicantUserId))
            .limit(1);
          if (identity?.emailVerified !== true)
            return { kind: "contact-unverified" };
        }
        const [saved] = await transaction
          .update(creatorApplications)
          .set({ state: nextState, updatedAt: input.changedAt })
          .where(eq(creatorApplications.id, application.id))
          .returning();
        if (saved === undefined) return { kind: "conflict" };
        await insertAdmissionEvent(transaction, {
          ...input,
          nextState,
          previousState: application.state,
          snapshotId: latest.id,
        });
        return { application: applicationView(saved), kind: "changed" };
      });
    },
  };
}
