import { describe, expect, it } from "vitest";

import { createPostgresContainerArguments } from "./support/postgres-container.ts";

describe("disposable PostgreSQL container", () => {
  it("keeps ephemeral database writes off slow persistent Docker storage", () => {
    const arguments_ = createPostgresContainerArguments({
      containerName: "test-container",
      password: "test-password",
    });

    expect(arguments_).toEqual(
      expect.arrayContaining(["--tmpfs", "/var/lib/postgresql:rw"]),
    );
    expect(arguments_.at(-1)).toBe("postgres:18.6-alpine");
  });
});
