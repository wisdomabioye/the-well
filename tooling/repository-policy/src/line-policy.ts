import { relative } from "node:path";

import { physicalLineCount } from "./files.ts";

export const maximumSourceLines = 300;

export async function findOversizedFiles(
  root: string,
  files: readonly string[],
): Promise<readonly string[]> {
  const violations: string[] = [];
  for (const file of files) {
    const lineCount = await physicalLineCount(file);
    if (lineCount > maximumSourceLines) {
      violations.push(`${relative(root, file)} has ${lineCount} lines.`);
    }
  }
  return violations;
}
