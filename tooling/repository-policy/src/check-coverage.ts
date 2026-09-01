import { mergeWorkspaceCoverage } from "./coverage-policy.ts";
import { discoverWorkspaces, repositoryRoot } from "./workspaces.ts";

const root = repositoryRoot(import.meta.url);
const result = await mergeWorkspaceCoverage(
  root,
  await discoverWorkspaces(root),
);

if (result.violations.length > 0) {
  throw new Error(
    `Coverage policy violations:\n- ${result.violations.join("\n- ")}`,
  );
}

console.log(
  "Merged coverage passed greater-than-90% line and branch thresholds.",
);
