import {
  authorizationPolicySchema,
  capabilitySchema,
  type AuthorizationPolicy,
} from "@ador/shared/accounts";
import type { UuidV7 } from "@ador/shared/identifiers";

import type { AuthorizationRepository } from "./repository.ts";

export interface AuthorizationDecision {
  readonly allowed: boolean;
  readonly policyVersion: string;
}

function decision(
  allowed: boolean,
  policy: AuthorizationPolicy,
): AuthorizationDecision {
  return { allowed, policyVersion: policy.version };
}

export function createAuthorizationService(dependencies: {
  readonly policy: AuthorizationPolicy;
  readonly repository: AuthorizationRepository;
}) {
  const policy = authorizationPolicySchema.parse(dependencies.policy);
  return {
    async forOrganization(input: {
      readonly capability: string;
      readonly organizationId: UuidV7;
      readonly userId: UuidV7;
    }): Promise<AuthorizationDecision> {
      if (!capabilitySchema.safeParse(input.capability).success)
        return decision(false, policy);
      const access = await dependencies.repository.findOrganizationAccess(
        input.userId,
        input.organizationId,
      );
      if (
        access === null ||
        access.membershipStatus !== "active" ||
        access.organizationStatus !== "active"
      )
        return decision(false, policy);
      return decision(
        policy.organization[access.role].includes(input.capability),
        policy,
      );
    },

    async forPlatform(input: {
      readonly capability: string;
      readonly userId: UuidV7;
    }): Promise<AuthorizationDecision> {
      if (!capabilitySchema.safeParse(input.capability).success)
        return decision(false, policy);
      const roles = await dependencies.repository.findPlatformRoles(
        input.userId,
      );
      return decision(
        roles.some((role) => policy.platform[role].includes(input.capability)),
        policy,
      );
    },
  };
}
