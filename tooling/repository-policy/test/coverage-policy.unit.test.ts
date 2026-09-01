import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { mergeWorkspaceCoverage } from "../src/coverage-policy.ts";
import type { Workspace } from "../src/workspaces.ts";

const temporaryDirectories: string[] = [];

async function coverageWorkspace(
  name: string,
  covered: number,
  total: number,
): Promise<[string, Workspace]> {
  const root = await mkdtemp(resolve(tmpdir(), "coverage-policy-"));
  temporaryDirectories.push(root);
  const directory = resolve(root, "packages/example");
  await mkdir(resolve(directory, "coverage"), { recursive: true });
  const metric = { covered, total };
  await writeFile(
    resolve(directory, "coverage/coverage-summary.json"),
    JSON.stringify({
      total: {
        branches: metric,
        functions: metric,
        lines: metric,
        statements: metric,
      },
    }),
  );
  await writeFile(
    resolve(directory, "coverage/lcov.info"),
    "TN:\nSF:src/index.ts\nend_of_record\n",
  );
  return [root, { directory, name, scripts: {} }];
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true })),
  );
});

describe("merged coverage policy", () => {
  it("accepts and combines workspace coverage above 90%", async () => {
    const [root, workspace] = await coverageWorkspace("example", 91, 100);
    const result = await mergeWorkspaceCoverage(root, [workspace]);
    expect(result.violations).toEqual([]);
    expect(result.total.lines).toEqual({ covered: 91, total: 100 });
    await expect(
      readFile(resolve(root, "coverage/lcov.info"), "utf8"),
    ).resolves.toContain("SF:packages/example/src/index.ts");
    await expect(
      readFile(resolve(root, "coverage/coverage-summary.json"), "utf8"),
    ).resolves.toContain('"pct": 91');
  });

  it("rejects workspace and aggregate coverage at 90%", async () => {
    const [root, workspace] = await coverageWorkspace("example", 90, 100);
    const result = await mergeWorkspaceCoverage(root, [workspace]);
    expect(result.violations).toEqual([
      "example branches coverage is 90.00%; expected >90%.",
      "example lines coverage is 90.00%; expected >90%.",
      "repository branches coverage is 90.00%; expected >90%.",
      "repository lines coverage is 90.00%; expected >90%.",
    ]);
  });

  it("reports missing workspace reports", async () => {
    const root = await mkdtemp(resolve(tmpdir(), "coverage-policy-missing-"));
    temporaryDirectories.push(root);
    const workspace = {
      directory: resolve(root, "missing"),
      name: "missing",
      scripts: {},
    };
    const result = await mergeWorkspaceCoverage(root, [workspace]);
    expect(result.violations[0]).toContain("is unavailable or invalid");
    expect(result.total.lines).toEqual({ covered: 0, total: 0 });
  });
});
