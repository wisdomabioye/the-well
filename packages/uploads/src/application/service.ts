import { createHash } from "node:crypto";

import type { ObjectStoragePort } from "@ador/object-storage/contracts";
import { parseObjectKey } from "@ador/object-storage/contracts";
import type { IdempotencyKey } from "@ador/shared/http";
import type { UuidV7 } from "@ador/shared/identifiers";
import {
  createUploadIntentInputSchema,
  resolveUploadPolicy,
  type CreateUploadIntentInput,
  type UploadPolicyOverrides,
} from "@ador/shared/uploads";

import type { UploadIntentRepository } from "./repository.ts";

export type CreateIntentResult =
  | {
      readonly intent: {
        readonly byteLength: number;
        readonly contentType: CreateUploadIntentInput["contentType"];
        readonly expiresAt: Date;
        readonly id: UuidV7;
        readonly purpose: CreateUploadIntentInput["purpose"];
      };
      readonly kind: "created";
      readonly upload: Awaited<
        ReturnType<ObjectStoragePort["presignPrivateUpload"]>
      >;
    }
  | { readonly kind: "conflict" }
  | { readonly kind: "invalid-size" }
  | { readonly kind: "quota-exceeded" };

export function createUploadIntentService(dependencies: {
  readonly clock: () => Date;
  readonly createDraftKey: () => string;
  readonly createId: () => UuidV7;
  readonly policy?: UploadPolicyOverrides;
  readonly repository: UploadIntentRepository;
  readonly storage: ObjectStoragePort;
}) {
  const policy = resolveUploadPolicy(dependencies.policy);
  return {
    async create(
      unvalidatedInput: CreateUploadIntentInput,
      context: {
        readonly idempotencyKey: IdempotencyKey;
        readonly userId: UuidV7;
      },
    ): Promise<CreateIntentResult> {
      const input = createUploadIntentInputSchema.parse(unvalidatedInput);
      if (input.byteLength > policy.maxBytesByPurpose[input.purpose]) {
        return { kind: "invalid-size" };
      }
      const createdAt = dependencies.clock();
      const expiresAt = new Date(
        createdAt.getTime() + policy.presignedUrlLifetimeMs,
      );
      const intentId = dependencies.createId();
      const objectKey = parseObjectKey(
        `drafts/${dependencies.createDraftKey()}`,
      );
      const fingerprint = createHash("sha256")
        .update(JSON.stringify(input))
        .digest("hex");
      const reserved = await dependencies.repository.reserve({
        ...input,
        activeLimit: policy.activeIntentLimitPerUser,
        cleanupEligibleAt: new Date(
          createdAt.getTime() + policy.cleanupDelayMs,
        ),
        createdAt,
        expiresAt,
        id: intentId,
        idempotencyKey: context.idempotencyKey,
        objectKey,
        requestFingerprint: fingerprint,
        retainUntil: new Date(createdAt.getTime() + policy.intentRetentionMs),
        userId: context.userId,
      });
      if (reserved.kind === "conflict" || reserved.kind === "quota-exceeded") {
        return reserved;
      }
      const remainingLifetimeSeconds = Math.floor(
        (reserved.intent.expiresAt.getTime() - createdAt.getTime()) / 1_000,
      );
      if (remainingLifetimeSeconds < 1) return { kind: "conflict" };
      try {
        const upload = await dependencies.storage.presignPrivateUpload({
          contentLength: reserved.intent.byteLength,
          contentType: reserved.intent.contentType,
          expiresInSeconds: remainingLifetimeSeconds,
          key: reserved.intent.objectKey,
        });
        return {
          intent: {
            byteLength: reserved.intent.byteLength,
            contentType: reserved.intent.contentType,
            expiresAt: reserved.intent.expiresAt,
            id: reserved.intent.id,
            purpose: reserved.intent.purpose,
          },
          kind: "created",
          upload,
        };
      } catch (error) {
        await dependencies.repository.markSigningFailed({
          failedAt: dependencies.clock(),
          intentId: reserved.intent.id,
          userId: context.userId,
        });
        throw error;
      }
    },
  };
}
