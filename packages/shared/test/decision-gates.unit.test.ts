import { describe, expect, it } from "vitest";

import {
  assertDecisionGateOpen,
  closedDecisionIds,
  decisionCatalogSchema,
} from "../src/decisions/gates.js";

const accepted = {
  acceptedAt: "2026-09-06",
  adr: "docs/decisions/ADR-013-example.md",
  deadline: "Week 1 exit",
  evidence: ["tests/decision-gate.test.ts"],
  id: "D15",
  owner: "product + engineering",
  requiredFields: ["claimant_binding"],
  selected: "Claimant-bound proof",
  status: "accepted",
  values: { claimant_binding: "Transaction-authorized claimant" },
} as const;

const catalog = {
  decisions: [accepted],
  gates: [{ id: "phase-zero-exit", requiredDecisions: ["D15"] }],
  version: 1,
} as const;

describe("decision gates", () => {
  it("opens only when every required decision has complete acceptance evidence", () => {
    const parsed = decisionCatalogSchema.parse(catalog);
    expect(closedDecisionIds(parsed, "phase-zero-exit")).toEqual([]);
    expect(() =>
      assertDecisionGateOpen(parsed, "phase-zero-exit"),
    ).not.toThrow();
  });

  it("reports every non-accepted decision that closes a gate", () => {
    const parsed = decisionCatalogSchema.parse({
      ...catalog,
      decisions: [
        {
          deadline: "Week 1 exit",
          id: "D15",
          owner: "product + engineering",
          requiredFields: ["claimant_binding"],
          status: "researching",
        },
      ],
    });
    expect(closedDecisionIds(parsed, "phase-zero-exit")).toEqual(["D15"]);
    expect(() => assertDecisionGateOpen(parsed, "phase-zero-exit")).toThrow(
      "phase-zero-exit is closed by: D15",
    );
  });

  it("keeps superseded decisions closed without rejecting their lifecycle state", () => {
    const parsed = decisionCatalogSchema.parse({
      ...catalog,
      decisions: [
        {
          deadline: "Week 1 exit",
          id: "D15",
          owner: "product + engineering",
          requiredFields: ["claimant_binding"],
          status: "superseded",
        },
      ],
    });
    expect(closedDecisionIds(parsed, "phase-zero-exit")).toEqual(["D15"]);
  });

  it.each([
    { ...accepted, owner: "_fill in_" },
    { ...accepted, selected: "TODO" },
    { ...accepted, evidence: [] },
    { ...accepted, evidence: ["../outside.txt"] },
    { ...accepted, evidence: ["/tmp/outside.txt"] },
    { ...accepted, evidence: ["evidence/a.txt", "evidence/a.txt"] },
    { ...accepted, adr: "D15.md" },
    { ...accepted, acceptedAt: "soon" },
    { ...accepted, values: {} },
    { ...accepted, values: { claimant_binding: "bound", extra: "surplus" } },
  ])("rejects incomplete accepted records", (decision) => {
    expect(() =>
      decisionCatalogSchema.parse({ ...catalog, decisions: [decision] }),
    ).toThrow();
  });

  it("rejects duplicate and dangling identifiers", () => {
    expect(() =>
      decisionCatalogSchema.parse({
        ...catalog,
        decisions: [
          {
            deadline: "Week 1 exit",
            id: "D15",
            owner: "product + engineering",
            requiredFields: ["claimant_binding", "claimant_binding"],
            status: "researching",
          },
        ],
      }),
    ).toThrow("Duplicate required decision field");
    expect(() =>
      decisionCatalogSchema.parse({
        ...catalog,
        decisions: [accepted, accepted],
      }),
    ).toThrow("Duplicate decision ID");
    expect(() =>
      decisionCatalogSchema.parse({
        ...catalog,
        gates: [{ id: "release", requiredDecisions: ["D22"] }],
      }),
    ).toThrow("references missing decision D22");
    expect(() =>
      decisionCatalogSchema.parse({
        ...catalog,
        gates: [...catalog.gates, ...catalog.gates],
      }),
    ).toThrow("Duplicate gate ID");
  });

  it("rejects an undeclared gate", () => {
    const parsed = decisionCatalogSchema.parse(catalog);
    expect(() => closedDecisionIds(parsed, "missing")).toThrow(
      "Decision gate is not defined",
    );
  });
});
