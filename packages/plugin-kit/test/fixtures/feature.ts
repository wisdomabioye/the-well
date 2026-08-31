import type { FeatureEntrypoint } from "../../src/registry.js";

export const fixtureEntrypoint = {
  id: "fixture",
  version: "1.0.0",
  capabilities: ["public-page"],
} as const satisfies FeatureEntrypoint;
