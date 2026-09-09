import type {
  AccountStatus,
  OrganizationRole,
  PlatformRole,
} from "@ador/shared/accounts";
import type { UuidV7 } from "@ador/shared/identifiers";

export interface OrganizationAccessRecord {
  readonly membershipStatus: AccountStatus;
  readonly organizationStatus: AccountStatus;
  readonly role: OrganizationRole;
}

export interface AuthorizationRepository {
  findOrganizationAccess(
    userId: UuidV7,
    organizationId: UuidV7,
  ): Promise<OrganizationAccessRecord | null>;
  findPlatformRoles(userId: UuidV7): Promise<readonly PlatformRole[]>;
}
