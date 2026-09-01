import { describe, expect, it } from "vitest";

import { domainEventEnvelopeSchema } from "../src/envelope.ts";

const event = {
  causationId: null,
  correlationId: "8fb5845f-a0e8-4ea6-8f25-d3a6c46dd92f",
  eventId: "26ebfbc8-1410-4d63-8751-c66a2235f7a1",
  name: "platform.fixture.created.v1",
  occurredAt: "2026-09-01T12:00:00.000Z",
  payload: { fixtureId: "fixture-1" },
  schemaVersion: 1,
} as const;

describe("domain event envelope", () => {
  it("accepts a versioned identifier-only event", () => {
    expect(domainEventEnvelopeSchema.parse(event)).toEqual(event);
  });

  it.each([
    [{ ...event, name: "fixture-created" }, "name"],
    [{ ...event, payload: {} }, "payload"],
    [{ ...event, payload: { fixtureId: "x".repeat(257) } }, "payload"],
    [{ ...event, payload: { secret: "must-not-travel" } }, "payload"],
    [{ ...event, schemaVersion: 0 }, "schemaVersion"],
    [{ ...event, schemaVersion: 2 }, "schemaVersion"],
    [{ ...event, extra: true }, "extra"],
  ])("rejects an invalid or unsafe envelope", (candidate, field) => {
    const result = domainEventEnvelopeSchema.safeParse(candidate);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain(field);
  });
});
