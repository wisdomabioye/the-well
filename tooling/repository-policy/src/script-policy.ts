import type { Workspace } from "./workspaces.ts";

export const requiredWorkspaceScripts = [
  "lint",
  "typecheck",
  "test:unit",
  "test:integration",
  "test:coverage",
] as const;

const forbiddenNoOpFragments = [
  "--passWithNoTests",
  "echo ",
  "exit 0",
] as const;

export function findScriptPolicyViolations(
  workspaces: readonly Workspace[],
): readonly string[] {
  const violations: string[] = [];
  for (const workspace of workspaces) {
    for (const scriptName of requiredWorkspaceScripts) {
      const command = workspace.scripts[scriptName]?.trim();
      if (!command) {
        violations.push(`${workspace.name} is missing ${scriptName}.`);
      } else if (
        forbiddenNoOpFragments.some((fragment) => command.includes(fragment))
      ) {
        violations.push(
          `${workspace.name} has a non-verifying ${scriptName} script.`,
        );
      }
    }
  }
  return violations;
}
