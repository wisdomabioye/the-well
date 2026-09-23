import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  checkEnvironmentFiles,
  checkEnvironmentTemplates,
  applicationEnvironmentFiles,
  environmentFiles,
  runEnvironmentFileCheck,
} from "../src/env/check-files.ts";

const repositoryRoot = resolve(import.meta.dirname, "../../..");
const temporaryDirectories: string[] = [];

async function createEnvironmentFixture(): Promise<string> {
  const fixtureRoot = await mkdtemp(join(tmpdir(), "the-well-env-"));
  temporaryDirectories.push(fixtureRoot);

  for (const filename of [
    ...environmentFiles,
    ...applicationEnvironmentFiles,
  ]) {
    const target = resolve(fixtureRoot, filename);
    const source = await readFile(resolve(repositoryRoot, filename), "utf8");
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, source, "utf8");
  }

  return fixtureRoot;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, {
        force: true,
        recursive: true,
      }),
    ),
  );
});

describe("environment file contract", () => {
  it("accepts every checked-in environment example", async () => {
    await expect(
      checkEnvironmentTemplates(repositoryRoot),
    ).resolves.toBeUndefined();
  });

  it("rejects drift in any mirrored environment file", async () => {
    const fixtureRoot = await createEnvironmentFixture();

    await writeFile(
      resolve(fixtureRoot, ".env.production.example"),
      "APP_ENV=production\n",
    );

    await expect(checkEnvironmentFiles(fixtureRoot)).rejects.toThrow(
      "canonical environment keys",
    );
  });

  it("rejects an incomplete ignored application environment", async () => {
    const fixtureRoot = await createEnvironmentFixture();
    await writeFile(
      resolve(fixtureRoot, "apps/web/.env.local"),
      "DATABASE_URL=postgresql://localhost/app\n",
    );
    await expect(checkEnvironmentFiles(fixtureRoot)).rejects.toThrow(
      "apps/web/.env.local must contain the canonical environment keys",
    );
  });

  it("does not conceal local environment read failures", async () => {
    const fixtureRoot = await createEnvironmentFixture();
    await mkdir(resolve(fixtureRoot, "apps/web/.env.local"));
    await expect(checkEnvironmentFiles(fixtureRoot)).rejects.toThrow();
  });

  it("runs the command-line contract only for its own executable", async () => {
    const checkerPath = resolve(
      import.meta.dirname,
      "../src/env/check-files.ts",
    );

    await expect(
      runEnvironmentFileCheck(checkerPath, checkerPath, repositoryRoot),
    ).resolves.toBe(true);
    await expect(runEnvironmentFileCheck(undefined, checkerPath)).resolves.toBe(
      false,
    );
  });
});
