import { describe, expect, it } from "vitest";

import {
  creatorApplicationDraftSchema,
  creatorApplicationSubmissionSchema,
  resolveCreatorAdmissionTransition,
} from "../src/creator-admission/index.ts";

const completeDraft = {
  contentDeclarationAccepted: true,
  displayName: "Arcade Builder",
  expectedLaunchSize: "A small beta cohort",
  expectedLaunchTiming: "After review",
  jurisdictionAcknowledged: true,
  portfolioLinks: ["https://example.test/work"],
  projectSummary: "A Bitcoin-native arcade experience.",
  provenanceDeclarationAccepted: true,
  rightsDeclarationAccepted: true,
};

describe("creator admission contracts", () => {
  it("accepts a complete submission and rejects unaccepted declarations", () => {
    expect(
      creatorApplicationSubmissionSchema.safeParse(completeDraft).success,
    ).toBe(true);
    expect(
      creatorApplicationSubmissionSchema.safeParse({
        ...completeDraft,
        rightsDeclarationAccepted: false,
      }).success,
    ).toBe(false);
  });

  it("rejects oversized, malformed, and additional draft data", () => {
    expect(
      creatorApplicationDraftSchema.safeParse({
        ...completeDraft,
        displayName: "x".repeat(121),
      }).success,
    ).toBe(false);
    expect(
      creatorApplicationDraftSchema.safeParse({
        ...completeDraft,
        portfolioLinks: ["not-a-url"],
      }).success,
    ).toBe(false);
    expect(
      creatorApplicationDraftSchema.safeParse({
        ...completeDraft,
        trusted: true,
      }).success,
    ).toBe(false);
  });

  it("allows only explicit lifecycle transitions", () => {
    expect(resolveCreatorAdmissionTransition("draft", "submit")).toBe(
      "submitted",
    );
    expect(
      resolveCreatorAdmissionTransition("submitted", "approve"),
    ).toBeNull();
    expect(resolveCreatorAdmissionTransition("under-review", "approve")).toBe(
      "approved",
    );
    expect(resolveCreatorAdmissionTransition("suspended", "reinstate")).toBe(
      "approved",
    );
    expect(resolveCreatorAdmissionTransition("revoked", "resubmit")).toBeNull();
    expect(
      resolveCreatorAdmissionTransition("rejected", "resubmit"),
    ).toBeNull();
  });
});
