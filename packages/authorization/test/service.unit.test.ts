import type { AuthorizationPolicy, PlatformRole } from "@ador/shared/accounts";
import { createUuidV7 } from "@ador/shared/identifiers";
import { describe, expect, it } from "vitest";

import type { AuthorizationRepository } from "../src/application/repository.ts";
import { createAuthorizationService } from "../src/application/service.ts";

const policy: AuthorizationPolicy = {
  organization: {
    admin: ["organization:members"],
    analyst: ["organization:read"],
    editor: ["organization:edit"],
    owner: ["organization:ownership", "organization:members"],
  },
  platform: {
    reviewer: ["creator:review"],
    staff: ["platform:operate"],
  },
  version: "test-v1",
};

function repository(input: {
  readonly membershipStatus?: "active" | "suspended";
  readonly missingMembership?: boolean;
  readonly organizationStatus?: "active" | "suspended";
  readonly platformRoles?: readonly PlatformRole[];
  readonly role?: "owner" | "admin" | "editor" | "analyst";
}): AuthorizationRepository {
  return {
    findOrganizationAccess: async () =>
      input.missingMembership
        ? null
        : {
            membershipStatus: input.membershipStatus ?? "active",
            organizationStatus: input.organizationStatus ?? "active",
            role: input.role ?? "analyst",
          },
    findPlatformRoles: async () => input.platformRoles ?? [],
  };
}

const userId = createUuidV7();
const organizationId = createUuidV7();

describe("authorization service", () => {
  it("allows only capabilities assigned to the active organization role", async () => {
    const service = createAuthorizationService({
      policy,
      repository: repository({}),
    });
    await expect(
      service.forOrganization({
        capability: "organization:read",
        organizationId,
        userId,
      }),
    ).resolves.toEqual({ allowed: true, policyVersion: "test-v1" });
    await expect(
      service.forOrganization({
        capability: "organization:edit",
        organizationId,
        userId,
      }),
    ).resolves.toEqual({ allowed: false, policyVersion: "test-v1" });
  });

  it.each([
    { missingMembership: true },
    { membershipStatus: "suspended" as const },
    { organizationStatus: "suspended" as const },
  ])("denies inactive organization access", async (state) => {
    const service = createAuthorizationService({
      policy,
      repository: repository(state),
    });
    await expect(
      service.forOrganization({
        capability: "organization:read",
        organizationId,
        userId,
      }),
    ).resolves.toEqual({ allowed: false, policyVersion: "test-v1" });
  });

  it("keeps platform capabilities separate from organization roles", async () => {
    const service = createAuthorizationService({
      policy,
      repository: repository({ platformRoles: ["reviewer"] }),
    });
    await expect(
      service.forPlatform({ capability: "creator:review", userId }),
    ).resolves.toEqual({ allowed: true, policyVersion: "test-v1" });
    await expect(
      service.forPlatform({ capability: "platform:operate", userId }),
    ).resolves.toEqual({ allowed: false, policyVersion: "test-v1" });
  });

  it("denies malformed capabilities without repository access", async () => {
    let called = false;
    const service = createAuthorizationService({
      policy,
      repository: {
        findOrganizationAccess: async () => {
          called = true;
          return null;
        },
        findPlatformRoles: async () => {
          called = true;
          return [];
        },
      },
    });
    await expect(
      service.forOrganization({
        capability: "invalid",
        organizationId,
        userId,
      }),
    ).resolves.toEqual({ allowed: false, policyVersion: "test-v1" });
    await expect(
      service.forPlatform({ capability: "invalid", userId }),
    ).resolves.toEqual({ allowed: false, policyVersion: "test-v1" });
    expect(called).toBe(false);
  });
});
