import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface Workspace {
  readonly directory: string;
  readonly name: string;
  readonly scripts: Readonly<Record<string, string>>;
}

interface PackageJson {
  readonly name?: string;
  readonly scripts?: Readonly<Record<string, string>>;
}

function parseWorkspacePatterns(contents: string): readonly string[] {
  return contents
    .split("\n")
    .map((line) => /^\s*-\s+["']([^"']+)["']\s*$/.exec(line)?.[1])
    .filter((pattern): pattern is string => pattern !== undefined);
}

async function readPackage(directory: string): Promise<Workspace> {
  const packagePath = resolve(directory, "package.json");
  const parsed = JSON.parse(await readFile(packagePath, "utf8")) as PackageJson;
  if (!parsed.name)
    throw new Error(`${packagePath} must declare a package name.`);
  return { directory, name: parsed.name, scripts: parsed.scripts ?? {} };
}

export async function discoverWorkspaces(
  root: string,
): Promise<readonly Workspace[]> {
  const workspaceFile = resolve(root, "pnpm-workspace.yaml");
  const patterns = parseWorkspacePatterns(
    await readFile(workspaceFile, "utf8"),
  );
  const directories: string[] = [];

  for (const pattern of patterns) {
    if (!pattern.endsWith("/*") || pattern.slice(0, -2).includes("*")) {
      throw new Error(`Unsupported workspace pattern: ${pattern}`);
    }
    const parent = resolve(root, pattern.slice(0, -2));
    for (const entry of await readdir(parent, { withFileTypes: true })) {
      if (entry.isDirectory()) directories.push(resolve(parent, entry.name));
    }
  }

  return Promise.all(directories.sort().map(readPackage));
}

export function repositoryRoot(moduleUrl: string): string {
  return resolve(dirname(fileURLToPath(moduleUrl)), "../../..");
}
