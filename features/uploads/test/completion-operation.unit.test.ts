import { uuidV7Schema } from "@ador/shared/identifiers";
import type { CompleteIntentResult } from "@ador/uploads";
import { describe, expect, it, vi } from "vitest";

import { createCompleteUploadIntentOperation } from "../src/application/completion-operation.ts";

const userId = uuidV7Schema.parse("018f22f2-9c1a-7b21-8c45-000000000001");
const intentId = uuidV7Schema.parse("018f22f2-9c1a-7b21-8c45-000000000002");
const assetId = uuidV7Schema.parse("018f22f2-9c1a-7b21-8c45-000000000003");
const context = {
  actorSession: null,
  actorUserId: userId,
  correlationId: userId,
};

function service(result: CompleteIntentResult) {
  return {
    complete: vi.fn(async () => result),
    create: vi.fn(),
  };
}

describe("complete upload intent operation", () => {
  it("requires authentication before constructing the service", async () => {
    const getService = vi.fn();
    const operation = createCompleteUploadIntentOperation(getService);
    await expect(
      operation.execute({ intentId }, { ...context, actorUserId: null }),
    ).resolves.toMatchObject({ error: "unauthorized", ok: false });
    expect(getService).not.toHaveBeenCalled();
  });

  it.each(["completed", "replayed"] as const)(
    "returns the pending asset for a %s completion",
    async (kind) => {
      const operation = createCompleteUploadIntentOperation(async () =>
        service({
          asset: { id: assetId, processingState: "pending-validation" },
          kind,
        }),
      );
      await expect(operation.execute({ intentId }, context)).resolves.toEqual({
        ok: true,
        value: {
          asset: { id: assetId, processingState: "pending-validation" },
        },
      });
    },
  );

  it.each([
    ["unavailable", "not_found"],
    ["missing-object", "conflict"],
    ["invalid-object", "invalid_request"],
  ] as const)("maps %s to %s", async (kind, error) => {
    const operation = createCompleteUploadIntentOperation(async () =>
      service({ kind }),
    );
    await expect(
      operation.execute({ intentId }, context),
    ).resolves.toMatchObject({ error, ok: false });
  });
});
