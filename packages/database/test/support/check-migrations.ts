import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const migrationsDirectory = resolve(import.meta.dirname, "../../migrations");

async function migrationDigest(): Promise<string> {
  const hash = createHash("sha256");
  const directories = await readdir(migrationsDirectory);

  for (const directory of directories.sort()) {
    const directoryPath = resolve(migrationsDirectory, directory);
    const filenames = await readdir(directoryPath);
    for (const filename of filenames.sort()) {
      hash.update(directory);
      hash.update(filename);
      hash.update(await readFile(resolve(directoryPath, filename)));
    }
  }
  return hash.digest("hex");
}

function runDrizzle(command: "check" | "generate"): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn("drizzle-kit", [command], { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else
        reject(new Error(`drizzle-kit ${command} exited with ${String(code)}`));
    });
  });
}

const before = await migrationDigest();
await runDrizzle("check");
await runDrizzle("generate");
const after = await migrationDigest();

if (before !== after) {
  throw new Error(
    "Drizzle schema drifted from committed migrations; review generated files.",
  );
}
