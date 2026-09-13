import { spawn } from "node:child_process";

import { withDisposableS3, type S3TestEnvironment } from "./s3-container.ts";

type TestMode = "coverage" | "integration";

async function runVitest(
  mode: TestMode,
  environment: S3TestEnvironment,
): Promise<void> {
  const args = ["exec", "vitest", "run", "--config", "vitest.config.ts"];
  if (mode === "integration") args.push("--project", "integration");
  else args.push("--coverage");

  await new Promise<void>((resolve, reject) => {
    const child = spawn("pnpm", args, {
      env: {
        ...process.env,
        S3_TEST_ACCESS_KEY_ID: environment.accessKeyId,
        S3_TEST_ENDPOINT: environment.endpoint,
        S3_TEST_SECRET_ACCESS_KEY: environment.secretAccessKey,
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
  throw new Error("Expected integration or coverage test mode.");
}
await withDisposableS3((environment) => runVitest(mode, environment));
