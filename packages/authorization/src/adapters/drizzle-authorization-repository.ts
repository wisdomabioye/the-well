import {
  organizationMemberships,
  organizations,
  platformRoleAssignments,
  type DatabaseClient,
} from "@ador/database";
import {
  accountStatusSchema,
  organizationRoleSchema,
  platformRoleSchema,
} from "@ador/shared/accounts";
import { and, eq } from "drizzle-orm";

import type { AuthorizationRepository } from "../application/repository.ts";

export function createDrizzleAuthorizationRepository(
  database: DatabaseClient,
): AuthorizationRepository {
  return {
    async findOrganizationAccess(userId, organizationId) {
      const [record] = await database
        .select({
          membershipStatus: organizationMemberships.status,
          organizationStatus: organizations.status,
          role: organizationMemberships.role,
        })
        .from(organizationMemberships)
        .innerJoin(
          organizations,
          eq(organizationMemberships.organizationId, organizations.id),
        )
        .where(
          and(
            eq(organizationMemberships.userId, userId),
            eq(organizationMemberships.organizationId, organizationId),
          ),
        )
        .limit(1);
      if (record === undefined) return null;
      return {
        membershipStatus: accountStatusSchema.parse(record.membershipStatus),
        organizationStatus: accountStatusSchema.parse(
          record.organizationStatus,
        ),
        role: organizationRoleSchema.parse(record.role),
      };
    },

    async findPlatformRoles(userId) {
      const records = await database
        .select({ role: platformRoleAssignments.role })
        .from(platformRoleAssignments)
        .where(
          and(
            eq(platformRoleAssignments.userId, userId),
            eq(platformRoleAssignments.status, "active"),
          ),
        );
      return records.map((record) => platformRoleSchema.parse(record.role));
    },
  };
}
