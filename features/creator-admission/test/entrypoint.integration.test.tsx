import { createUuidV7 } from "@ador/shared/identifiers";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const findMine = vi.fn();

vi.mock("../src/runtime.ts", () => ({
  getCreatorAdmissionService: () => ({
    findMine,
    review: vi.fn(),
    saveDraft: vi.fn(),
    submit: vi.fn(),
  }),
}));

import { createCreatorAdmissionEntrypoint } from "../src/entrypoint.tsx";

describe("creator admission entrypoint", () => {
  it("contributes matching operations and pages", () => {
    const entrypoint = createCreatorAdmissionEntrypoint();
    expect(entrypoint.operations).toHaveLength(4);
    expect(entrypoint.pages?.map(({ path }) => path)).toEqual([
      "/studio/creator-application",
      "/admin/creator-applications",
    ]);
  });

  it("renders saved, anonymous, reviewer, and degraded page states", async () => {
    const actorUserId = createUuidV7();
    findMine
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error("offline"));
    const pages = createCreatorAdmissionEntrypoint().pages ?? [];
    const studio = pages[0];
    const review = pages[1];
    if (studio === undefined || review === undefined)
      throw new Error("Expected pages");
    expect(
      renderToStaticMarkup(
        await studio.render({ actorUserId, navigation: [], params: {} }),
      ),
    ).toContain("Apply to create");
    expect(
      renderToStaticMarkup(
        await studio.render({ actorUserId: null, navigation: [], params: {} }),
      ),
    ).toBe("");
    expect(
      renderToStaticMarkup(
        await studio.render({ actorUserId, navigation: [], params: {} }),
      ),
    ).toContain("No state is being inferred");
    expect(
      renderToStaticMarkup(
        await review.render({ actorUserId, navigation: [], params: {} }),
      ),
    ).toContain("Admission review");
  });
});
