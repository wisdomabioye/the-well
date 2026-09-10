import { getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
  creatorAdmissionEvents,
  creatorApplications,
  creatorApplicationSnapshots,
} from "../src/index.ts";

function names(table: Parameters<typeof getTableConfig>[0]) {
  const config = getTableConfig(table);
  return {
    checks: config.checks.map(({ name }) => name),
    foreignTables: config.foreignKeys.map((key) =>
      getTableName(key.reference().foreignTable),
    ),
    indexes: config.indexes.flatMap(({ config: index }) => index.name ?? []),
  };
}

describe("creator admission schema", () => {
  it("enforces one application per applicant and positive revisions", () => {
    expect(names(creatorApplications)).toEqual(
      expect.objectContaining({
        checks: ["creator_applications_revision_positive"],
        foreignTables: ["auth_users"],
        indexes: expect.arrayContaining([
          "creator_applications_applicant_unique",
          "creator_applications_state_updated_idx",
        ]),
      }),
    );
  });

  it("constrains immutable snapshot identity and hashes", () => {
    expect(names(creatorApplicationSnapshots)).toEqual(
      expect.objectContaining({
        checks: expect.arrayContaining([
          "creator_snapshots_sequence_positive",
          "creator_snapshots_schema_version_supported",
          "creator_snapshots_verified_email_nonempty",
          "creator_snapshots_hash_sha256",
        ]),
        foreignTables: ["creator_applications", "auth_users"],
        indexes: ["creator_snapshots_application_sequence_unique"],
      }),
    );
  });

  it("constrains audit policy evidence and idempotency", () => {
    expect(names(creatorAdmissionEvents)).toEqual(
      expect.objectContaining({
        checks: expect.arrayContaining([
          "creator_events_reason_code_valid",
          "creator_events_policy_version_nonempty",
          "creator_events_request_fingerprint_sha256",
        ]),
        foreignTables: [
          "creator_applications",
          "creator_application_snapshots",
          "auth_users",
        ],
        indexes: expect.arrayContaining([
          "creator_events_idempotency_unique",
          "creator_events_application_created_idx",
        ]),
      }),
    );
  });
});
