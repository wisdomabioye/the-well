import { defineFeature } from "@ador/plugin-kit";
import { openApiDocumentRoute } from "@ador/http/openapi";
import { platformStatusRoute } from "@ador/shared/platform";

export const platformShellFeature = defineFeature({
  manifest: {
    id: "platform-shell",
    version: "1.0.0",
    capabilities: ["api-routes", "navigation", "public-page"],
    dependencies: [],
    requiredProviderCapabilities: [],
    routes: [openApiDocumentRoute, platformStatusRoute],
  },
  load: async () =>
    import("@ador/feature-platform-shell/entrypoint").then(
      ({ platformShellEntrypoint }) => platformShellEntrypoint,
    ),
});
