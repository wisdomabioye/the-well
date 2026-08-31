import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  checkEnvironmentFiles,
  environmentFiles,
  runEnvironmentFileCheck,
} from "../src/env/check-files.ts";

const repositoryRoot = resolve(import.meta.dirname, "../../..");
const temporaryDirectories: string[] = [];

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
      checkEnvironmentFiles(repositoryRoot),
    ).resolves.toBeUndefined();
  });

  it("rejects drift in any mirrored environment file", async () => {
    const fixtureRoot = await mkdtemp(join(tmpdir(), "the-well-env-"));
    temporaryDirectories.push(fixtureRoot);

    for (const filename of environmentFiles) {
      const source = await readFile(resolve(repositoryRoot, filename), "utf8");
      await writeFile(resolve(fixtureRoot, filename), source, "utf8");
    }

    await writeFile(
      resolve(fixtureRoot, ".env.production.example"),
      "APP_ENV=production\n",
    );

    await expect(checkEnvironmentFiles(fixtureRoot)).rejects.toThrow(
      "canonical environment keys",
    );
  });

  it("runs the command-line contract only for its own executable", async () => {
    const checkerPath = resolve(
      import.meta.dirname,
      "../src/env/check-files.ts",
    );

    await expect(
      runEnvironmentFileCheck(checkerPath, checkerPath),
    ).resolves.toBe(true);
    await expect(runEnvironmentFileCheck(undefined, checkerPath)).resolves.toBe(
      false,
    );
  });
});
