import type { UploadContentType, UploadPurpose } from "@ador/shared/uploads";
import type { IdempotencyKey } from "@ador/shared/http";
import type { UuidV7 } from "@ador/shared/identifiers";
import type { ObjectKey } from "@ador/object-storage/contracts";

export interface UploadIntentView {
  readonly byteLength: number;
  readonly contentType: UploadContentType;
  readonly expiresAt: Date;
  readonly id: UuidV7;
  readonly objectKey: ObjectKey;
  readonly purpose: UploadPurpose;
}

export type ReserveUploadIntentResult =
  | {
      readonly intent: UploadIntentView;
      readonly kind: "reserved" | "replayed";
    }
  | { readonly kind: "conflict" }
  | { readonly kind: "quota-exceeded" };

export interface UploadIntentRepository {
  markSigningFailed(input: {
    readonly failedAt: Date;
    readonly intentId: UuidV7;
    readonly userId: UuidV7;
  }): Promise<void>;
  reserve(
    input: UploadIntentView & {
      readonly activeLimit: number;
      readonly cleanupEligibleAt: Date;
      readonly createdAt: Date;
      readonly idempotencyKey: IdempotencyKey;
      readonly requestFingerprint: string;
      readonly retainUntil: Date;
      readonly userId: UuidV7;
    },
  ): Promise<ReserveUploadIntentResult>;
}
