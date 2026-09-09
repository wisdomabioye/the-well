import { getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
  accountAuditEvents,
  organizationMemberships,
  organizations,
  platformRoleAssignments,
} from "../src/index.ts";

function indexNames(config: ReturnType<typeof getTableConfig>): string[] {
  return config.indexes.flatMap((value) => value.config.name ?? []);
}

function foreignTables(config: ReturnType<typeof getTableConfig>): string[] {
  return config.foreignKeys.map((key) =>
    getTableName(key.reference().foreignTable),
  );
}

describe("account schema", () => {
  it("constrains organization names", () => {
    expect(
      getTableConfig(organizations).checks.map((check) => check.name),
    ).toContain("organizations_name_nonempty");
  });

  it("makes membership unique within an organization", () => {
    const config = getTableConfig(organizationMemberships);
    expect(indexNames(config)).toEqual(
      expect.arrayContaining([
        "organization_memberships_org_user_unique",
        "organization_memberships_user_id_idx",
        "organization_memberships_org_role_status_idx",
      ]),
    );
    expect(foreignTables(config)).toEqual(
      expect.arrayContaining(["organizations", "auth_users"]),
    );
  });

  it("keeps platform role assignments unique by user and role", () => {
    const config = getTableConfig(platformRoleAssignments);
    expect(indexNames(config)).toEqual(
      expect.arrayContaining([
        "platform_role_assignments_user_role_unique",
        "platform_role_assignments_role_status_idx",
      ]),
    );
    expect(foreignTables(config)).toEqual(["auth_users"]);
  });

  it("retains immutable account audit ownership and policy evidence", () => {
    const config = getTableConfig(accountAuditEvents);
    expect(indexNames(config)).toContain(
      "account_audit_events_org_created_idx",
    );
    expect(config.checks.map((check) => check.name)).toContain(
      "account_audit_events_policy_version_nonempty",
    );
    expect(config.checks.map((check) => check.name)).toContain(
      "account_audit_events_reason_code_valid",
    );
    expect(foreignTables(config)).toEqual(
      expect.arrayContaining(["auth_users", "organizations"]),
    );
  });
});
