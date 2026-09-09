import type { AuthorizationPolicy } from "@ador/shared/accounts";

export const authorizationPolicy = {
  organization: {
    admin: ["organization:members"],
    analyst: ["organization:read"],
    editor: ["organization:edit"],
    owner: ["organization:members", "organization:ownership"],
  },
  platform: {
    reviewer: ["creator:review"],
    staff: ["platform:operate"],
  },
  version: "beta-v1",
} as const satisfies AuthorizationPolicy;
