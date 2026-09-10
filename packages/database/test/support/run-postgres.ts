import { spawn } from "node:child_process";

import { withDisposablePostgres } from "./postgres-container.ts";

type TestMode = "integration" | "coverage";

async function runVitest(mode: TestMode, url: string): Promise<void> {
  const args = ["exec", "vitest", "run", "--config", "vitest.config.ts"];
  if (mode === "integration") args.push("--project", "integration");
  else args.push("--coverage");

  await new Promise<void>((resolve, reject) => {
    const child = spawn("pnpm", args, {
      env: {
        ...process.env,
        DATABASE_URL: url,
        DATABASE_MIGRATION_URL: "",
        DATABASE_SSL_MODE: "disable",
        DATABASE_POOL_MAX: "4",
        DATABASE_ACQUIRE_TIMEOUT_MS: "5000",
        DATABASE_IDLE_TIMEOUT_MS: "1000",
        DATABASE_STATEMENT_TIMEOUT_MS: "5000",
      },
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Vitest exited with code ${String(code)}`));
    });
  });
}

const mode = process.argv[2];
if (mode !== "integration" && mode !== "coverage") {
  throw new Error("Expected integration or coverage test mode");
}
await withDisposablePostgres((url) => runVitest(mode, url));
