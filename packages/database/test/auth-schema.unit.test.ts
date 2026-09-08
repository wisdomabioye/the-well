import { getTableConfig } from "drizzle-orm/pg-core";
import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import {
  authSessions,
  authUsers,
  walletChallenges,
  walletIdentities,
} from "../src/index.ts";

function names(values: readonly { readonly name?: string }[]): string[] {
  return values.flatMap((value) => value.name ?? []);
}

function indexNames(
  values: readonly { readonly config: { readonly name?: string } }[],
): string[] {
  return values.flatMap((value) => value.config.name ?? []);
}

function referencedTables(config: ReturnType<typeof getTableConfig>): string[] {
  return config.foreignKeys.map((key) =>
    getTableName(key.reference().foreignTable),
  );
}

describe("authentication schema", () => {
  it("defines session hash, lifecycle, and ownership constraints", () => {
    const config = getTableConfig(authSessions);
    expect(indexNames(config.indexes)).toEqual(
      expect.arrayContaining([
        "auth_sessions_token_hash_unique",
        "auth_sessions_user_id_idx",
      ]),
    );
    expect(names(config.checks)).toEqual(
      expect.arrayContaining([
        "auth_sessions_idle_before_absolute",
        "auth_sessions_token_hash_sha256",
      ]),
    );
    expect(config.foreignKeys).toHaveLength(1);
    expect(referencedTables(config)).toEqual(["auth_users"]);
  });

  it("defines wallet identity uniqueness and supported-value checks", () => {
    const config = getTableConfig(walletIdentities);
    expect(indexNames(config.indexes)).toContain(
      "wallet_identities_network_script_unique",
    );
    expect(names(config.checks)).toEqual(
      expect.arrayContaining([
        "wallet_identities_network_supported",
        "wallet_identities_adapter_nonempty",
      ]),
    );
    expect(config.foreignKeys).toHaveLength(1);
    expect(referencedTables(config)).toEqual(["auth_users"]);
  });

  it("defines single-use challenge indexes, checks, and user ownership", () => {
    const config = getTableConfig(walletChallenges);
    expect(indexNames(config.indexes)).toEqual(
      expect.arrayContaining([
        "wallet_challenges_nonce_unique",
        "wallet_challenges_expiry_idx",
      ]),
    );
    expect(names(config.checks)).toEqual(
      expect.arrayContaining([
        "wallet_challenges_attempts_nonnegative",
        "wallet_challenges_expiry_after_issue",
        "wallet_challenges_network_supported",
        "wallet_challenges_signature_scheme_supported",
        "wallet_challenges_schema_version_supported",
        "wallet_challenges_message_hash_sha256",
      ]),
    );
    expect(config.foreignKeys).toHaveLength(1);
    expect(referencedTables(config)).toEqual(["auth_users"]);
  });

  it("keeps wallet users independent of provider-specific tables", () => {
    const config = getTableConfig(authUsers);
    expect(config.name).toBe("auth_users");
    expect(config.schema).toBe("ador");
    expect(config.columns.map((column) => column.name)).toEqual(
      expect.arrayContaining(["id", "email", "email_verified"]),
    );
  });
});
