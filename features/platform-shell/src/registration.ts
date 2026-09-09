import { defineFeature } from "@ador/plugin-kit";
import { platformStatusRoute } from "@ador/shared/platform";

export const platformShellFeature = defineFeature({
  manifest: {
    id: "platform-shell",
    version: "1.0.0",
    capabilities: ["api-routes", "navigation", "public-page"],
    dependencies: [],
    requiredDecisionGates: [],
    requiredProviderCapabilities: [],
    pages: [{ access: { kind: "public" }, path: "/" }],
    routes: [platformStatusRoute],
  },
  load: async (context) =>
    import("@ador/feature-platform-shell/entrypoint").then(
      ({ createPlatformShellEntrypoint }) =>
        createPlatformShellEntrypoint(context),
    ),
});
