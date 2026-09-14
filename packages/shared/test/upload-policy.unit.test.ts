import { describe, expect, it } from "vitest";

import {
  defaultUploadPolicy,
  resolveUploadPolicy,
  uploadPurposeSchema,
} from "../src/uploads/index.ts";

describe("upload policy", () => {
  it("owns the approved configurable beta defaults", () => {
    expect(defaultUploadPolicy).toMatchObject({
      activeIntentLimitPerUser: 2,
      cleanupDelayMs: 86_400_000,
      intentRetentionMs: 2_592_000_000,
      maxBytesByPurpose: {
        "collection-artwork": 25_000_000,
        "collection-banner": 15_000_000,
        "collection-item-artwork": 25_000_000,
        "creator-avatar": 5_000_000,
      },
      presignedUrlLifetimeMs: 900_000,
    });
    expect(resolveUploadPolicy({ activeIntentLimitPerUser: 1 })).toMatchObject({
      activeIntentLimitPerUser: 1,
    });
    expect(
      resolveUploadPolicy({
        maxBytesByPurpose: { "creator-avatar": 1_000_000 },
      }).maxBytesByPurpose,
    ).toEqual({
      ...defaultUploadPolicy.maxBytesByPurpose,
      "creator-avatar": 1_000_000,
    });
  });

  it("fails closed for unknown purposes and unsafe policy overrides", () => {
    expect(uploadPurposeSchema.safeParse("game-bundle").success).toBe(false);
    expect(() =>
      resolveUploadPolicy({
        cleanupDelayMs: defaultUploadPolicy.presignedUrlLifetimeMs,
      }),
    ).toThrow("Cleanup delay");
  });
});
