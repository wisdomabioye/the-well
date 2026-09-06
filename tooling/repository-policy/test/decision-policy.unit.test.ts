import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  findDecisionPolicyViolations,
  renderDecisionGateReference,
} from "../src/decision-policy.js";

const pendingCatalog = {
  decisions: [
    {
      deadline: "Week 1 exit",
      id: "D15",
      owner: "product + engineering",
      requiredFields: ["claimant_binding"],
      status: "researching",
    },
  ],
  gates: [{ id: "phase-zero-exit", requiredDecisions: ["D15"] }],
  version: 1,
} as const;

describe("decision policy", () => {
  it("renders a deterministic decision and gate reference", () => {
    expect(renderDecisionGateReference(pendingCatalog)).toContain(
      "| phase-zero-exit | D15 |",
    );
  });

  it("reports reference drift", async () => {
    const root = await mkdtemp(join(tmpdir(), "decision-policy-"));
    await expect(
      findDecisionPolicyViolations(root, pendingCatalog),
    ).resolves.toEqual([
      "references/decision-gates.md is out of sync with the decision catalog",
    ]);
  });

  it("checks accepted ADR and evidence paths", async () => {
    const root = await mkdtemp(join(tmpdir(), "decision-policy-"));
    const acceptedCatalog = {
      ...pendingCatalog,
      decisions: [
        {
          acceptedAt: "2026-09-06",
          adr: "docs/decisions/ADR-013-example.md",
          deadline: "Week 1 exit",
          evidence: ["evidence/d15.txt"],
          id: "D15",
          owner: "product + engineering",
          requiredFields: ["claimant_binding"],
          selected: "Claimant-bound proof",
          status: "accepted",
          values: { claimant_binding: "Transaction-authorized claimant" },
        },
      ],
    } as const;
    await mkdir(join(root, "references"));
    await writeFile(
      join(root, "references/decision-gates.md"),
      renderDecisionGateReference(acceptedCatalog),
      "utf8",
    );
    await expect(
      findDecisionPolicyViolations(root, acceptedCatalog),
    ).resolves.toEqual([
      "D15 references a missing ADR: docs/decisions/ADR-013-example.md",
      "D15 references missing evidence: evidence/d15.txt",
    ]);

    await mkdir(join(root, "docs/decisions"), { recursive: true });
    await mkdir(join(root, "evidence"));
    await mkdir(join(root, acceptedCatalog.decisions[0].adr));
    await mkdir(join(root, acceptedCatalog.decisions[0].evidence[0]));
    await expect(
      findDecisionPolicyViolations(root, acceptedCatalog),
    ).resolves.toEqual([
      "D15 references a missing ADR: docs/decisions/ADR-013-example.md",
      "D15 references missing evidence: evidence/d15.txt",
    ]);

    const fileRoot = await mkdtemp(join(tmpdir(), "decision-policy-"));
    await mkdir(join(fileRoot, "references"));
    await mkdir(join(fileRoot, "docs/decisions"), { recursive: true });
    await mkdir(join(fileRoot, "evidence"));
    await writeFile(
      join(fileRoot, "references/decision-gates.md"),
      renderDecisionGateReference(acceptedCatalog),
      "utf8",
    );
    await writeFile(
      join(fileRoot, acceptedCatalog.decisions[0].adr),
      "ADR",
      "utf8",
    );
    await writeFile(
      join(fileRoot, acceptedCatalog.decisions[0].evidence[0]),
      "proof",
      "utf8",
    );
    await expect(
      findDecisionPolicyViolations(fileRoot, acceptedCatalog),
    ).resolves.toEqual([]);
  });
});
