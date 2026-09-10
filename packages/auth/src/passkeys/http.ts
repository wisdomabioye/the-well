import { uuidV7TextSchema } from "@ador/shared/identifiers";
import { z } from "zod";

import {
  passkeyRegistrationOptionsSchema,
  passkeyRegistrationPayloadSchema,
} from "./contracts.ts";

export const passkeyRoutes = {
  list: {
    method: "GET",
    operationId: "listPasskeys",
    path: "/api/v1/passkeys",
  },
  beginRegistration: {
    method: "POST",
    operationId: "beginPasskeyRegistration",
    path: "/api/v1/passkeys/registration/options",
  },
  finishRegistration: {
    method: "POST",
    operationId: "finishPasskeyRegistration",
    path: "/api/v1/passkeys/registration/verify",
  },
  unlink: {
    method: "POST",
    operationId: "unlinkPasskey",
    path: "/api/v1/passkeys/unlink",
  },
} as const;

export const passkeyEmptyInputSchema = z.strictObject({});
export const passkeyListResponseSchema = z.strictObject({
  credentialIds: z.array(
    z
      .string()
      .min(1)
      .regex(/^[A-Za-z0-9_-]+$/),
  ),
});
export const passkeyBeginResponseSchema = z.strictObject({
  challengeId: uuidV7TextSchema,
  expiresAt: z.iso.datetime(),
  options: passkeyRegistrationOptionsSchema,
});
export const passkeyFinishInputSchema = z.strictObject({
  challengeId: uuidV7TextSchema,
  credential: passkeyRegistrationPayloadSchema,
});
export const passkeyUnlinkInputSchema = z.strictObject({
  credentialId: z
    .string()
    .min(1)
    .regex(/^[A-Za-z0-9_-]+$/),
});
export const passkeyMutationResponseSchema = z.strictObject({
  changed: z.literal(true),
});

export type PasskeyBeginResponse = z.infer<typeof passkeyBeginResponseSchema>;
export type PasskeyFinishInput = z.infer<typeof passkeyFinishInputSchema>;
export type PasskeyMutationResponse = z.infer<
  typeof passkeyMutationResponseSchema
>;
export type PasskeyListResponse = z.infer<typeof passkeyListResponseSchema>;
export type PasskeyUnlinkInput = z.infer<typeof passkeyUnlinkInputSchema>;
