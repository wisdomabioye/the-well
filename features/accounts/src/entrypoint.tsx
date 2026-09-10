import type { FeatureEntrypoint } from "@ador/plugin-kit";
import { registerHttpOperation } from "@ador/http/registered-operation";
import type { UuidV7 } from "@ador/shared/identifiers";

import { createPasskeyOperations } from "./application/passkey-operations.ts";
import { getPasskeyLinkingService } from "./runtime.ts";
import { AccountSurface } from "./ui/account-surface.tsx";

type PasskeyService = ReturnType<typeof getPasskeyLinkingService>;

async function account(
  actorUserId: UuidV7 | null,
  getService: () => PasskeyService,
) {
  if (actorUserId === null) return null;
  try {
    return (
      <AccountSurface
        actorUserId={actorUserId}
        passkeyCredentialIds={await getService().list(actorUserId)}
        surface="account"
      />
    );
  } catch {
    return (
      <AccountSurface
        actorUserId={actorUserId}
        passkeysUnavailable
        surface="account"
      />
    );
  }
}

export function createAccountsEntrypoint(
  getService: () => PasskeyService = getPasskeyLinkingService,
): FeatureEntrypoint {
  const [list, begin, finish, unlink] = createPasskeyOperations(getService);
  return {
    capabilities: ["api-routes", "authenticated-page", "navigation"],
    id: "accounts",
    operations: [
      registerHttpOperation(list),
      registerHttpOperation(begin),
      registerHttpOperation(finish),
      registerHttpOperation(unlink),
    ],
    pages: [
      {
        access: { kind: "authenticated" },
        path: "/account",
        render: ({ actorUserId }) => account(actorUserId, getService),
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
