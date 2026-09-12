import { describe, expect, it } from "vitest";

import { laserEyesProviderIds } from "../src/conformance/contracts.ts";
import {
  candidate,
  evaluate,
  evidence,
  passingConnectEvidence,
  policy,
} from "./conformance.fixtures.ts";

describe("evaluateWalletQualifications", () => {
  it("keeps provider identifiers explicit for typed deployment configuration", () => {
    expect(laserEyesProviderIds).toContain("xverse");
    expect(new Set(laserEyesProviderIds).size).toBe(
      laserEyesProviderIds.length,
    );
  });
  it("enables a candidate only when its requested matrix passes", () => {
    expect(evaluate()).toEqual({ enabled: [candidate], failures: [] });
  });

  it.each([
    [passingConnectEvidence.slice(1), "has no passing evidence"],
    [
      [
        evidence("connect-approved", { outcome: "failed" }),
        ...passingConnectEvidence.slice(1),
      ],
      "failed",
    ],
    [
      [
        evidence("connect-approved", { observedAt: "invalid" }),
        ...passingConnectEvidence.slice(1),
      ],
      "invalid",
    ],
    [
      [
        evidence("connect-approved", {
          observedAt: "2026-09-10T00:00:00.000Z",
        }),
        ...passingConnectEvidence.slice(1),
      ],
      "stale",
    ],
    [
      [
        evidence("connect-approved", {
          observedAt: "2026-09-13T00:00:00.000Z",
        }),
        ...passingConnectEvidence.slice(1),
      ],
      "future",
    ],
    [
      [
        evidence("connect-approved", { fixtureId: "other" }),
        ...passingConnectEvidence.slice(1),
      ],
      "fixture",
    ],
    [
      [
        evidence("connect-approved", {
          versions: { core: "0.0.0", react: "0.0.80" },
        }),
        ...passingConnectEvidence.slice(1),
      ],
      "version",
    ],
    [[...passingConnectEvidence, evidence("connect-approved")], "duplicate"],
  ] as const)(
    "fails closed for missing or invalid evidence",
    (matrix, message) => {
      const result = evaluate({ evidence: matrix });
      expect(result.enabled).toEqual([]);
      expect(result.failures.join(" ")).toContain(message);
    },
  );

  it("binds checks to exact environment, network, address type, and capability", () => {
    const result = evaluate({
      candidates: [
        {
          ...candidate,
          capabilities: ["connect", "message-sign", "psbt-sign"],
        },
      ],
      policy: {
        ...policy,
        addressTypes: ["p2tr", "p2wpkh"],
        environments: [
          ...policy.environments,
          {
            browser: { name: "webkit", version: "26.0" },
            device: { category: "mobile", os: "iOS 26" },
          },
        ],
        networks: ["signet", "mainnet"],
      },
    });
    expect(result.enabled).toEqual([]);
    expect(result.failures).toHaveLength(84);
  });

  it.each([
    [{ ...policy, addressTypes: [] }, "address types"],
    [{ ...policy, environments: [] }, "environments"],
    [{ ...policy, fixtureId: "" }, "fixture"],
    [{ ...policy, maximumEvidenceAgeMs: 0 }, "lifetime"],
    [{ ...policy, maximumEvidenceAgeMs: Number.POSITIVE_INFINITY }, "lifetime"],
    [{ ...policy, networks: [] }, "networks"],
    [{ ...policy, addressTypes: ["p2tr", "p2tr"] }, "duplicates"],
    [{ ...policy, networks: ["signet", "signet"] }, "duplicates"],
    [{ ...policy, messageSigningSchemes: ["bip322", "bip322"] }, "duplicates"],
    [
      {
        ...policy,
        environments: [...policy.environments, ...policy.environments],
      },
      "duplicates",
    ],
    [
      {
        ...policy,
        environments: [
          { ...policy.environments[0], browser: { name: " ", version: "140" } },
        ],
      },
      "blank",
    ],
  ] as const)("rejects a vacuous policy", (invalidPolicy, message) => {
    const result = evaluate({ policy: invalidPolicy });
    expect(result.enabled).toEqual([]);
    expect(result.failures.join(" ")).toContain(message);
  });

  it.each([
    [
      [{ capabilities: [], provider: "xverse", walletVersion: "1.0.0" }],
      "no capabilities",
    ],
    [
      [
        {
          capabilities: ["connect", "connect"],
          provider: "xverse",
          walletVersion: "1.0.0",
        },
      ],
      "duplicate capabilities",
    ],
    [[candidate, candidate], "configured more than once"],
    [
      [
        {
          capabilities: ["message-sign"],
          provider: "xverse",
          walletVersion: "1.0.0",
        },
      ],
      "without connection",
    ],
    [[{ ...candidate, walletVersion: " " }], "no wallet version"],
  ] as const)(
    "rejects invalid candidate configuration",
    (candidates, message) => {
      const result = evaluate({ candidates });
      expect(result.enabled).toEqual([]);
      expect(result.failures.join(" ")).toContain(message);
    },
  );

  it("returns no enabled provider when no candidate is configured", () => {
    expect(evaluate({ candidates: [] })).toEqual({ enabled: [], failures: [] });
  });

  it("rejects a non-finite evaluation clock", () => {
    const result = evaluate({ nowMs: Number.NaN });
    expect(result.enabled).toEqual([]);
    expect(result.failures).toContain("Evaluation time must be finite.");
  });

  it("isolates failed evidence to its provider", () => {
    const result = evaluate({
      candidates: [candidate],
      evidence: [
        ...passingConnectEvidence,
        evidence("connect-approved", { outcome: "failed", provider: "unisat" }),
      ],
    });
    expect(result.enabled).toEqual([candidate]);
    expect(result.failures.join(" ")).toContain("unisat");
  });

  it("rejects evidence from a different wallet version", () => {
    const result = evaluate({
      evidence: passingConnectEvidence.map((item) => ({
        ...item,
        walletVersion: "2.0.0",
      })),
    });
    expect(result.enabled).toEqual([]);
    expect(result.failures.join(" ")).toContain("has no passing evidence");
  });

  it("requires each configured authentication signing scheme", () => {
    const result = evaluate({
      candidates: [{ ...candidate, capabilities: ["connect", "message-sign"] }],
      evidence: passingConnectEvidence,
      policy: { ...policy, messageSigningSchemes: ["bip322", "legacy"] },
    });
    expect(result.enabled).toEqual([]);
    expect(result.failures).toHaveLength(6);
  });

  it("requires a signing scheme only when message signing is requested", () => {
    expect(
      evaluate({ policy: { ...policy, messageSigningSchemes: [] } }),
    ).toEqual({ enabled: [candidate], failures: [] });

    const result = evaluate({
      candidates: [{ ...candidate, capabilities: ["connect", "message-sign"] }],
      policy: { ...policy, messageSigningSchemes: [] },
    });
    expect(result.enabled).toEqual([]);
    expect(result.failures).toContain(
      "xverse has no required message signing scheme.",
    );
  });

  it("rejects a signing scheme that is incompatible with its check", () => {
    const result = evaluate({
      evidence: [
        evidence("connect-approved", { signingScheme: "bip322" }),
        ...passingConnectEvidence.slice(1),
      ],
    });
    expect(result.enabled).toEqual([]);
    expect(result.failures.join(" ")).toContain("incompatible signing scheme");
  });
});
