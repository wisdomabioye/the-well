import { randomUUID } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const POSTGRES_IMAGE = "postgres:18.6-alpine";
const POSTGRES_PORT = "5432/tcp";
const DATABASE_NAME = "ador_test";
const DATABASE_USER = "ador_test";
const DATABASE_PASSWORD = randomUUID();
const containerName = `ador-postgres-${randomUUID()}`;
let containerStarted = false;

function removeContainer(): void {
  if (!containerStarted) return;
  spawnSync("docker", ["rm", "--force", containerName], { stdio: "ignore" });
  containerStarted = false;
}

function handleInterruption(signal: NodeJS.Signals): void {
  removeContainer();
  process.kill(process.pid, signal);
}

process.once("SIGINT", handleInterruption);
process.once("SIGTERM", handleInterruption);

function run(command: string, args: readonly string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "inherit"],
    });
    let output = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      output += chunk;
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve(output.trim());
      else reject(new Error(`${command} exited with code ${String(code)}`));
    });
  });
}

async function waitForPostgres(): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      await run("docker", [
        "exec",
        containerName,
        "pg_isready",
        "--username",
        DATABASE_USER,
        "--dbname",
        DATABASE_NAME,
      ]);
      return;
    } catch {
      await delay(500);
    }
  }
  throw new Error("PostgreSQL test container did not become ready");
}

async function runVitest(mode: "integration" | "coverage", url: string) {
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

async function main(): Promise<void> {
  const mode = process.argv[2];
  if (mode !== "integration" && mode !== "coverage") {
    throw new Error("Expected integration or coverage test mode");
  }

  await run("docker", [
    "run",
    "--detach",
    "--name",
    containerName,
    "--env",
    `POSTGRES_DB=${DATABASE_NAME}`,
    "--env",
    `POSTGRES_USER=${DATABASE_USER}`,
    "--env",
    `POSTGRES_PASSWORD=${DATABASE_PASSWORD}`,
    "--publish",
    "127.0.0.1::5432",
    POSTGRES_IMAGE,
  ]);
  containerStarted = true;

  try {
    await waitForPostgres();
    const mapping = await run("docker", ["port", containerName, POSTGRES_PORT]);
    const port = mapping.slice(mapping.lastIndexOf(":") + 1);
    const url = `postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@127.0.0.1:${port}/${DATABASE_NAME}`;
    await runVitest(mode, url);
  } finally {
    removeContainer();
  }
}

await main();
