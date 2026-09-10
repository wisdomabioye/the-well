import { defineFeature } from "@ador/plugin-kit";
import { passkeyRoutes } from "@ador/auth";

export const accountsFeature = defineFeature({
  manifest: {
    capabilities: ["api-routes", "authenticated-page", "navigation"],
    dependencies: [],
    id: "accounts",
    pages: [
      { access: { kind: "authenticated" }, path: "/account" },
      { access: { kind: "authenticated" }, path: "/studio" },
      {
        access: { capability: "platform:operate", kind: "platform" },
        path: "/admin",
      },
    ],
    requiredDecisionGates: [],
    requiredProviderCapabilities: [],
    routes: Object.values(passkeyRoutes),
    version: "1.0.0",
  },
  load: async () =>
    import("@ador/feature-accounts/entrypoint").then(
      ({ createAccountsEntrypoint }) => createAccountsEntrypoint(),
    ),
});
