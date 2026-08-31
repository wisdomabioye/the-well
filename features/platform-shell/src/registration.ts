import { defineFeature } from "@ador/plugin-kit";

export const platformShellFeature = defineFeature({
  manifest: {
    id: "platform-shell",
    version: "1.0.0",
    capabilities: ["navigation", "public-page"],
    dependencies: [],
  },
  load: async () =>
    import("@ador/feature-platform-shell/entrypoint").then(
      ({ platformShellEntrypoint }) => platformShellEntrypoint,
    ),
});
