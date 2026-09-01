import { mkdir, readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { z } from "zod";

import type { Workspace } from "./workspaces.ts";

const metricSchema = z.object({ covered: z.number(), total: z.number() });
const totalSchema = z.object({
  branches: metricSchema,
  functions: metricSchema,
  lines: metricSchema,
  statements: metricSchema,
});
const summarySchema = z.object({ total: totalSchema }).passthrough();
type CoverageTotal = z.infer<typeof totalSchema>;

const requiredPercentage = 90;

function percentage(metric: z.infer<typeof metricSchema>): number {
  return metric.total === 0 ? 100 : (metric.covered / metric.total) * 100;
}

function addTotals(left: CoverageTotal, right: CoverageTotal): CoverageTotal {
  return {
    branches: {
      covered: left.branches.covered + right.branches.covered,
      total: left.branches.total + right.branches.total,
    },
    functions: {
      covered: left.functions.covered + right.functions.covered,
      total: left.functions.total + right.functions.total,
    },
    lines: {
      covered: left.lines.covered + right.lines.covered,
      total: left.lines.total + right.lines.total,
    },
    statements: {
      covered: left.statements.covered + right.statements.covered,
      total: left.statements.total + right.statements.total,
    },
  };
}

function reportTotal(total: CoverageTotal) {
  return Object.fromEntries(
    Object.entries(total).map(([name, metric]) => [
      name,
      { ...metric, skipped: 0, pct: Number(percentage(metric).toFixed(2)) },
    ]),
  );
}

function normalizeLcov(
  root: string,
  workspace: Workspace,
  contents: string,
): string {
  const workspacePath = relative(root, workspace.directory);
  return contents.replace(/^SF:(.+)$/gm, (_match, sourcePath: string) => {
    const normalized = isAbsolute(sourcePath)
      ? relative(root, sourcePath)
      : join(workspacePath, sourcePath);
    return `SF:${normalized}`;
  });
}

const emptyTotal: CoverageTotal = {
  branches: { covered: 0, total: 0 },
  functions: { covered: 0, total: 0 },
  lines: { covered: 0, total: 0 },
  statements: { covered: 0, total: 0 },
};

function violationsFor(name: string, total: CoverageTotal): readonly string[] {
  return (["branches", "lines"] as const).flatMap((metric) => {
    const value = percentage(total[metric]);
    return value > requiredPercentage
      ? []
      : [`${name} ${metric} coverage is ${value.toFixed(2)}%; expected >90%.`];
  });
}

export interface CoverageResult {
  readonly total: CoverageTotal;
  readonly violations: readonly string[];
}

export async function mergeWorkspaceCoverage(
  root: string,
  workspaces: readonly Workspace[],
): Promise<CoverageResult> {
  let merged = emptyTotal;
  const violations: string[] = [];
  const summaries: Record<string, CoverageTotal> = {};
  const lcovParts: string[] = [];

  for (const workspace of workspaces) {
    const summaryPath = resolve(
      workspace.directory,
      "coverage/coverage-summary.json",
    );
    try {
      const summary = summarySchema.parse(
        JSON.parse(await readFile(summaryPath, "utf8")),
      );
      summaries[workspace.name] = summary.total;
      merged = addTotals(merged, summary.total);
      violations.push(...violationsFor(workspace.name, summary.total));
      lcovParts.push(
        normalizeLcov(
          root,
          workspace,
          await readFile(
            resolve(workspace.directory, "coverage/lcov.info"),
            "utf8",
          ),
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      violations.push(
        `${relative(root, summaryPath)} is unavailable or invalid: ${message}`,
      );
    }
  }

  violations.push(...violationsFor("repository", merged));
  const outputDirectory = resolve(root, "coverage");
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    resolve(outputDirectory, "coverage-summary.json"),
    `${JSON.stringify(
      {
        total: reportTotal(merged),
        workspaces: Object.fromEntries(
          Object.entries(summaries).map(([name, total]) => [
            name,
            reportTotal(total),
          ]),
        ),
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(resolve(outputDirectory, "lcov.info"), lcovParts.join("\n"));
  return { total: merged, violations };
}
