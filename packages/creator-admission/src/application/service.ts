import {
  platformRoles,
  type AuthorizationPolicy,
  type PlatformRole,
} from "@ador/shared/accounts";
import {
  creatorAdmissionPolicyVersion,
  creatorApplicationDraftSchema,
  creatorApplicationSchemaVersion,
  creatorApplicationSubmissionSchema,
  creatorReviewDecisionSchema,
  type CreatorApplicationDraft,
  type CreatorReviewDecision,
} from "@ador/shared/creator-admission";
import { createHash } from "node:crypto";

import { correlationIdSchema, idempotencyKeySchema } from "@ador/shared/http";
import type { UuidV7 } from "@ador/shared/identifiers";

import type {
  CreatorAdmissionRepository,
  MutationContext,
} from "./repository.ts";

export interface CreatorAdmissionDependencies {
  readonly authorizationPolicy: AuthorizationPolicy;
  readonly clock: () => Date;
  readonly createId: () => UuidV7;
  readonly repository: CreatorAdmissionRepository;
}

export interface CreatorMutationRequestContext {
  readonly actorUserId: UuidV7;
  readonly correlationId: string;
  readonly idempotencyKey: string;
}

function context(
  input: CreatorMutationRequestContext,
  dependencies: CreatorAdmissionDependencies,
  fingerprintSource: object,
): MutationContext {
  return {
    actorUserId: input.actorUserId,
    changedAt: dependencies.clock(),
    correlationId: correlationIdSchema.parse(input.correlationId),
    idempotencyKey: idempotencyKeySchema.parse(input.idempotencyKey),
    policyVersion: creatorAdmissionPolicyVersion,
    requestFingerprint: createHash("sha256")
      .update(JSON.stringify(fingerprintSource))
      .digest("hex"),
  };
}

function reviewerRoles(policy: AuthorizationPolicy): readonly PlatformRole[] {
  return platformRoles.filter((role) =>
    policy.platform[role].includes("creator:review"),
  );
}

export function createCreatorAdmissionService(
  dependencies: CreatorAdmissionDependencies,
) {
  const allowedReviewerRoles = reviewerRoles(dependencies.authorizationPolicy);
  return {
    findMine(actorUserId: UuidV7) {
      return dependencies.repository.findForApplicant(actorUserId);
    },

    saveDraft(
      draftInput: CreatorApplicationDraft,
      request: CreatorMutationRequestContext,
    ) {
      const draft = creatorApplicationDraftSchema.parse(draftInput);
      return dependencies.repository.saveDraft({
        ...context(request, dependencies, { draft, operation: "save-draft" }),
        applicationId: dependencies.createId(),
        draft,
      });
    },

    async submit(request: CreatorMutationRequestContext) {
      const application = await dependencies.repository.findForApplicant(
        request.actorUserId,
      );
      if (application === null) return { kind: "not-found" } as const;
      creatorApplicationSubmissionSchema.parse(application.draft);
      return dependencies.repository.submit({
        ...context(request, dependencies, { operation: "submit" }),
        schemaVersion: creatorApplicationSchemaVersion,
      });
    },

    review(
      decisionInput: CreatorReviewDecision,
      request: CreatorMutationRequestContext,
    ) {
      const decision = creatorReviewDecisionSchema.parse(decisionInput);
      return dependencies.repository.review({
        ...context(request, dependencies, { decision, operation: "review" }),
        ...decision,
        allowedReviewerRoles,
      });
    },
  };
}
