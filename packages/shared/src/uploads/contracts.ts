import { z } from "zod";

import { uuidV7TextSchema } from "../identifiers/uuid-v7.ts";
import { uploadPurposeSchema } from "./upload-policy.ts";

export const uploadContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const uploadContentTypeSchema = z.enum(uploadContentTypes);
export type UploadContentType = z.infer<typeof uploadContentTypeSchema>;

export const createUploadIntentInputSchema = z
  .object({
    byteLength: z.number().int().positive(),
    contentType: uploadContentTypeSchema,
    purpose: uploadPurposeSchema,
  })
  .strict();

export const uploadIntentResponseSchema = z
  .object({
    intent: z
      .object({
        byteLength: z.number().int().positive(),
        contentType: uploadContentTypeSchema,
        expiresAt: z.iso.datetime({ offset: true }),
        id: uuidV7TextSchema,
        purpose: uploadPurposeSchema,
      })
      .strict(),
    upload: z
      .object({
        expiresAt: z.iso.datetime({ offset: true }),
        headers: z.record(z.string(), z.string()),
        method: z.literal("PUT"),
        url: z.url({ protocol: /^https$/ }),
      })
      .strict(),
  })
  .strict();

export const uploadIntentRoutes = {
  create: {
    method: "POST",
    operationId: "createUploadIntent",
    path: "/api/v1/uploads/intents",
  },
} as const;

export type CreateUploadIntentInput = z.infer<
  typeof createUploadIntentInputSchema
>;
export type UploadIntentResponse = z.infer<typeof uploadIntentResponseSchema>;
