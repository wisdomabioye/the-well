import { defineFeature } from "@ador/plugin-kit";

export const accountsFeature = defineFeature({
  manifest: {
    capabilities: ["authenticated-page", "navigation"],
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
    routes: [],
    version: "1.0.0",
  },
  load: async () =>
    import("@ador/feature-accounts/entrypoint").then(
      ({ createAccountsEntrypoint }) => createAccountsEntrypoint(),
    ),
});
