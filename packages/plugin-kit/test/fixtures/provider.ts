import type { ProviderEntrypoint } from "../../src/provider-registry.js";

export const fixtureProviderEntrypoint = {
  capabilities: ["system:status"],
  id: "fixture-provider",
  version: "1.0.0",
} as const satisfies ProviderEntrypoint;
