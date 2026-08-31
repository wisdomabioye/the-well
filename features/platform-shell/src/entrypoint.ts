import type { FeatureEntrypoint } from "@ador/plugin-kit";

export const platformShellEntrypoint = {
  id: "platform-shell",
  version: "1.0.0",
  capabilities: ["navigation", "public-page"],
} as const satisfies FeatureEntrypoint;
