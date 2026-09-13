import { uuidV7TextSchema } from "@ador/shared/identifiers";
import { describe, expect, it } from "vitest";

import { creatorE2EFixtures } from "../src/creator-fixtures.ts";

describe("creator E2E fixtures", () => {
  it("uses distinct UUIDv7 identities for every seeded record", () => {
    const ids = [
      creatorE2EFixtures.applicant.sessionId,
      creatorE2EFixtures.applicant.userId,
      creatorE2EFixtures.reviewer.roleId,
      creatorE2EFixtures.reviewer.sessionId,
      creatorE2EFixtures.reviewer.userId,
      creatorE2EFixtures.passkeyUser.sessionId,
      creatorE2EFixtures.passkeyUser.userId,
      creatorE2EFixtures.staff.roleId,
      creatorE2EFixtures.staff.sessionId,
      creatorE2EFixtures.staff.userId,
      creatorE2EFixtures.visualUser.sessionId,
      creatorE2EFixtures.visualUser.userId,
    ];
    expect(ids.map((id) => uuidV7TextSchema.parse(id))).toHaveLength(
      ids.length,
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps every seeded session credential distinct", () => {
    const tokens = [
      creatorE2EFixtures.applicant.sessionToken,
      creatorE2EFixtures.passkeyUser.sessionToken,
      creatorE2EFixtures.reviewer.sessionToken,
      creatorE2EFixtures.staff.sessionToken,
      creatorE2EFixtures.visualUser.sessionToken,
    ];
    expect(new Set(tokens).size).toBe(tokens.length);
  });

  it("keeps role-bearing credentials attached to their named actor", () => {
    expect(creatorE2EFixtures.reviewer.sessionToken).toContain("reviewer");
    expect(creatorE2EFixtures.staff.sessionToken).toContain("staff");
    expect(creatorE2EFixtures.visualUser.sessionToken).toContain("visual");
  });
});
