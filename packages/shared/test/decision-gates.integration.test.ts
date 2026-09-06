import { describe, expect, it } from "vitest";

import { decisionCatalogSchema } from "../src/decisions/gates.js";

describe("decision catalog serialization", () => {
  it("round-trips pending records and gate dependencies through JSON", () => {
    const serialized = JSON.stringify({
      decisions: [
        {
          deadline: "Start Week 5",
          id: "D13",
          owner: "product + engineering",
          requiredFields: ["publication_strategy"],
          status: "unresolved",
        },
      ],
      gates: [{ id: "phase-three-entry", requiredDecisions: ["D13"] }],
      version: 1,
    });
    const parsed = decisionCatalogSchema.parse(JSON.parse(serialized));
    expect(JSON.stringify(parsed)).toBe(serialized);
  });
});
