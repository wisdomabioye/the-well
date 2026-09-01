import { describe, expect, it } from "vitest";

import { findBoundaryViolations } from "../src/boundary-policy.ts";
import { listSourceFiles } from "../src/files.ts";
import { findOversizedFiles } from "../src/line-policy.ts";
import { findScriptPolicyViolations } from "../src/script-policy.ts";
import { discoverWorkspaces, repositoryRoot } from "../src/workspaces.ts";

describe("repository policy integration", () => {
  it("accepts the checked-in workspace", async () => {
    const root = repositoryRoot(import.meta.url);
    const workspaces = await discoverWorkspaces(root);
    const files = await listSourceFiles(root);

    expect(workspaces.map(({ name }) => name)).toContain(
      "@repo/repository-policy",
    );
    expect(findScriptPolicyViolations(workspaces)).toEqual([]);
    await expect(findOversizedFiles(root, files)).resolves.toEqual([]);
    await expect(findBoundaryViolations(root, files)).resolves.toEqual([]);
  });
});
