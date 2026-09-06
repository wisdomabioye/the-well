import { describe, expect, it } from "vitest";

import type { OutboxEvent } from "../src/schema/outbox.js";
import { toClaimedEvent } from "../src/outbox/relay-store.js";

const row: OutboxEvent = {
  attempts: 1,
  availableAt: new Date("2026-09-06T12:00:00.000Z"),
  causationId: null,
  correlationId: "8fb5845f-a0e8-4ea6-8f25-d3a6c46dd92f",
  deliveredAt: null,
  eventId: "26ebfbc8-1410-4d63-8751-c66a2235f7a1",
  eventName: "platform.fixture.created.v1",
  failureReason: null,
  leaseExpiresAt: new Date("2026-09-06T12:01:00.000Z"),
  leaseId: "a8e4d617-963f-41f6-b5e8-6ebc70817890",
  occurredAt: new Date("2026-09-06T12:00:00.000Z"),
  payload: { fixtureId: "fixture-1" },
  schemaVersion: 1,
  status: "delivering",
};

describe("outbox relay row boundary", () => {
  it("rejects a claimed row without its required lease", () => {
    expect(() => toClaimedEvent({ ...row, leaseId: null })).toThrow(
      "Claimed outbox event has no lease ID.",
    );
  });

  it("rejects database payload drift before publication", () => {
    expect(() =>
      toClaimedEvent({ ...row, payload: { secret: "must-not-publish" } }),
    ).toThrow();
  });
});
