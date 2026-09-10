import { createUuidV7 } from "@ador/shared/identifiers";
import { describe, expect, it, vi } from "vitest";

import { createCreatorApplicationOperations } from "../src/application/operations.ts";

const actorUserId = createUuidV7();
const application = {
  applicantUserId: actorUserId,
  draft: {
    contentDeclarationAccepted: true,
    displayName: "Creator",
    expectedLaunchSize: "Small",
    expectedLaunchTiming: "After review",
    jurisdictionAcknowledged: true,
    portfolioLinks: [],
    projectSummary: "Summary",
    provenanceDeclarationAccepted: true,
    rightsDeclarationAccepted: true,
  },
  id: createUuidV7(),
  revision: 1,
  state: "draft" as const,
};
const context = {
  actorSession: null,
  actorUserId,
  correlationId: createUuidV7(),
  idempotencyKey: "operation-request-0001",
};

function service() {
  return {
    findMine: vi.fn().mockResolvedValue(application),
    review: vi.fn().mockResolvedValue({ application, kind: "changed" }),
    saveDraft: vi.fn().mockResolvedValue({ application, kind: "changed" }),
    submit: vi.fn().mockResolvedValue({ application, kind: "changed" }),
  };
}

describe("creator application operations", () => {
  it("declares authenticated and reviewer access independently", () => {
    const [mine, draftOperation, submit, review] =
      createCreatorApplicationOperations(service);
    expect([mine.access, draftOperation.access, submit.access]).toEqual([
      { kind: "authenticated" },
      { kind: "authenticated" },
      { kind: "authenticated" },
    ]);
    expect(review.access).toEqual({
      capability: "creator:review",
      kind: "platform",
    });
  });

  it("returns only the actor application and fails closed without an actor", async () => {
    const storage = service();
    const [mine] = createCreatorApplicationOperations(() => storage);
    await expect(mine.execute({}, context)).resolves.toEqual({
      ok: true,
      value: { application },
    });
    await expect(
      mine.execute({}, { ...context, actorUserId: null }),
    ).resolves.toMatchObject({ error: "unauthorized", ok: false });
    storage.findMine.mockResolvedValue(null);
    await expect(mine.execute({}, context)).resolves.toMatchObject({
      error: "not_found",
      ok: false,
    });
  });

  it("forwards mutation context and maps repository failures", async () => {
    const storage = service();
    const [, saveDraft, submit, review] = createCreatorApplicationOperations(
      () => storage,
    );
    await expect(
      saveDraft.execute({ draft: application.draft }, context),
    ).resolves.toMatchObject({ ok: true });
    await expect(submit.execute({}, context)).resolves.toMatchObject({
      ok: true,
    });
    await expect(
      review.execute(
        {
          action: "start-review",
          applicationId: application.id,
          creatorFeedback: "",
          evidenceReferences: [],
          privateNotes: "",
          reasonCode: "review-started",
        },
        context,
      ),
    ).resolves.toMatchObject({ ok: true });
    expect(storage.saveDraft).toHaveBeenCalledWith(application.draft, {
      actorUserId,
      correlationId: context.correlationId,
      idempotencyKey: context.idempotencyKey,
    });
    for (const [kind, error] of [
      ["conflict", "conflict"],
      ["contact-unverified", "forbidden"],
      ["forbidden", "forbidden"],
      ["not-found", "not_found"],
    ] as const) {
      storage.submit.mockResolvedValueOnce({ kind });
      await expect(submit.execute({}, context)).resolves.toMatchObject({
        error,
        ok: false,
      });
    }
  });

  it("rejects missing mutation identity and idempotency context", async () => {
    const [, saveDraft, submit, review] =
      createCreatorApplicationOperations(service);
    await expect(
      saveDraft.execute(
        { draft: application.draft },
        { ...context, actorUserId: null },
      ),
    ).resolves.toMatchObject({ error: "unauthorized" });
    await expect(
      submit.execute({}, { ...context, actorUserId: null }),
    ).resolves.toMatchObject({ error: "unauthorized" });
    await expect(
      review.execute(
        {
          action: "approve",
          applicationId: application.id,
          creatorFeedback: "",
          evidenceReferences: [],
          privateNotes: "",
          reasonCode: "meets-policy",
        },
        { ...context, actorUserId: null },
      ),
    ).resolves.toMatchObject({ error: "unauthorized" });
    const incomplete = {
      actorSession: null,
      actorUserId,
      correlationId: context.correlationId,
    };
    await expect(submit.execute({}, incomplete)).rejects.toThrow(
      "Idempotency boundary missing",
    );
    await expect(
      saveDraft.execute({ draft: application.draft }, incomplete),
    ).rejects.toThrow("Idempotency boundary missing");
    await expect(
      review.execute(
        {
          action: "approve",
          applicationId: application.id,
          creatorFeedback: "",
          evidenceReferences: [],
          privateNotes: "",
          reasonCode: "meets-policy",
        },
        incomplete,
      ),
    ).rejects.toThrow("Idempotency boundary missing");
  });
});
