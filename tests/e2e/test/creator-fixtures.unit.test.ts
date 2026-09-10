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
    ];
    expect(ids.map((id) => uuidV7TextSchema.parse(id))).toHaveLength(
      ids.length,
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps applicant and reviewer session credentials distinct", () => {
    expect(creatorE2EFixtures.applicant.sessionToken).not.toBe(
      creatorE2EFixtures.reviewer.sessionToken,
    );
  });
});
