import { expect, it } from "vitest";

import { relayOutboxBatch } from "../src/outbox-relay.js";

it("leaves an empty queue unchanged", async () => {
  const transitions: string[] = [];
  const result = await relayOutboxBatch(
    {
      clock: { now: () => new Date("2026-09-06T12:00:00.000Z") },
      createLeaseId: () => "a8e4d617-963f-41f6-b5e8-6ebc70817890",
      jitter: () => 0,
      publisher: { publish: async () => undefined },
      store: {
        claim: async () => [],
        fail: async () => void transitions.push("failed"),
        markDelivered: async () => void transitions.push("delivered"),
        retry: async () => void transitions.push("retried"),
      },
    },
    {
      batchSize: 1,
      leaseDurationMs: 1_000,
      maxAttempts: 1,
      retryBaseMs: 1_000,
      retryMaxMs: 1_000,
    },
  );
  expect(result).toEqual({ claimed: 0, delivered: 0, failed: 0, retried: 0 });
  expect(transitions).toEqual([]);
});
