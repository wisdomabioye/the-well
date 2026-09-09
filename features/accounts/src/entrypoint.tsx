import type { FeatureEntrypoint } from "@ador/plugin-kit";

import { AccountSurface } from "./ui/account-surface.tsx";

export function createAccountsEntrypoint(): FeatureEntrypoint {
  return {
    capabilities: ["authenticated-page", "navigation"],
    id: "accounts",
    pages: [
      {
        access: { kind: "authenticated" },
        path: "/account",
        render: ({ actorUserId }) =>
          actorUserId === null ? null : (
            <AccountSurface actorUserId={actorUserId} surface="account" />
          ),
      },
      {
        access: { kind: "authenticated" },
        path: "/studio",
        render: ({ actorUserId }) =>
          actorUserId === null ? null : (
            <AccountSurface actorUserId={actorUserId} surface="studio" />
          ),
      },
      {
        access: { capability: "platform:operate", kind: "platform" },
        path: "/admin",
        render: ({ actorUserId }) =>
          actorUserId === null ? null : (
            <AccountSurface actorUserId={actorUserId} surface="admin" />
          ),
      },
    ],
    version: "1.0.0",
  };
}
