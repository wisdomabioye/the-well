import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { environmentKeys } from "./definitions.ts";

export const environmentFiles = [
  ".env.example",
  ".env.local.example",
  ".env.test.example",
  ".env.preview.example",
  ".env.production.example",
] as const;

function extractKeys(contents: string): string[] {
  return contents
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => line.slice(0, line.indexOf("=")));
}

export async function checkEnvironmentFiles(root: string): Promise<void> {
  for (const filename of environmentFiles) {
    const contents = await readFile(resolve(root, filename), "utf8");
    const actualKeys = extractKeys(contents);
    if (actualKeys.join("\n") !== environmentKeys.join("\n")) {
      throw new Error(
        `${filename} must contain the canonical environment keys in order.`,
      );
    }
  }
}

const modulePath = fileURLToPath(import.meta.url);

export async function runEnvironmentFileCheck(
  executablePath: string | undefined,
  currentModulePath: string,
): Promise<boolean> {
  if (executablePath !== currentModulePath) {
    return false;
  }

  const repositoryRoot = resolve(dirname(currentModulePath), "../../../..");
  await checkEnvironmentFiles(repositoryRoot);
  return true;
}

await runEnvironmentFileCheck(process.argv[1], modulePath);
