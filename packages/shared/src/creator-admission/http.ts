import { z } from "zod";

import {
  creatorApplicationDraftSchema,
  creatorApplicationStateSchema,
  creatorReviewDecisionSchema,
} from "./contracts.ts";
import { uuidV7TextSchema } from "../identifiers/uuid-v7.ts";

export const creatorApplicationViewSchema = z
  .object({
    applicantUserId: uuidV7TextSchema,
    draft: creatorApplicationDraftSchema,
    id: uuidV7TextSchema,
    revision: z.number().int().positive(),
    state: creatorApplicationStateSchema,
  })
  .strict();

export const creatorApplicationResponseSchema = z
  .object({ application: creatorApplicationViewSchema })
  .strict();
export const creatorApplicationDraftInputSchema = z
  .object({ draft: creatorApplicationDraftSchema })
  .strict();
export const creatorApplicationEmptyInputSchema = z.object({}).strict();
export const creatorApplicationReviewInputSchema = creatorReviewDecisionSchema
  .omit({ applicationId: true })
  .extend({ applicationId: uuidV7TextSchema })
  .strict();

export const creatorApplicationRoutes = Object.freeze({
  mine: {
    method: "GET",
    operationId: "getCreatorApplication",
    path: "/api/v1/creator-application",
  },
  review: {
    method: "POST",
    operationId: "reviewCreatorApplication",
    path: "/api/v1/creator-application/review",
  },
  saveDraft: {
    method: "PUT",
    operationId: "saveCreatorApplicationDraft",
    path: "/api/v1/creator-application/draft",
  },
  submit: {
    method: "POST",
    operationId: "submitCreatorApplication",
    path: "/api/v1/creator-application/submit",
  },
} as const);

export type CreatorApplicationResponse = z.infer<
  typeof creatorApplicationResponseSchema
>;
export type CreatorApplicationDraftInput = z.infer<
  typeof creatorApplicationDraftInputSchema
>;
export type CreatorApplicationEmptyInput = z.infer<
  typeof creatorApplicationEmptyInputSchema
>;
export type CreatorApplicationReviewInput = z.infer<
  typeof creatorApplicationReviewInputSchema
>;
