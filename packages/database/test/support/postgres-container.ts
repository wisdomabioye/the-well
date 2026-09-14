import { randomUUID } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const postgresImage = "postgres:18.6-alpine";
const postgresPort = "5432/tcp";
const postgresDataDirectory = "/var/lib/postgresql";
const databaseName = "ador_test";
const databaseUser = "ador_test";

export function createPostgresContainerArguments(input: {
  readonly containerName: string;
  readonly password: string;
}): readonly string[] {
  return [
    "run",
    "--detach",
    "--name",
    input.containerName,
    "--env",
    `POSTGRES_DB=${databaseName}`,
    "--env",
    `POSTGRES_USER=${databaseUser}`,
    "--env",
    `POSTGRES_PASSWORD=${input.password}`,
    "--tmpfs",
    `${postgresDataDirectory}:rw`,
    "--publish",
    "127.0.0.1::5432",
    postgresImage,
  ];
}

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

async function waitForPostgres(containerName: string): Promise<void> {
  let consecutiveReadyChecks = 0;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      await run("docker", [
        "exec",
        containerName,
        "pg_isready",
        "--username",
        databaseUser,
        "--dbname",
        databaseName,
      ]);
      consecutiveReadyChecks += 1;
      if (consecutiveReadyChecks === 2) return;
      await delay(250);
    } catch {
      consecutiveReadyChecks = 0;
      await delay(500);
    }
  }
  throw new Error("PostgreSQL test container did not become ready");
}

export async function withDisposablePostgres(
  callback: (databaseUrl: string) => Promise<void>,
): Promise<void> {
  const password = randomUUID();
  const containerName = `ador-postgres-${randomUUID()}`;
  let started = false;
  const removeSync = () => {
    if (!started) return;
    spawnSync("docker", ["rm", "--force", containerName], {
      stdio: "ignore",
    });
    started = false;
  };
  const interrupt = (signal: NodeJS.Signals) => {
    removeSync();
    process.kill(process.pid, signal);
  };
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);
  try {
    await run(
      "docker",
      createPostgresContainerArguments({ containerName, password }),
    );
    started = true;
    await waitForPostgres(containerName);
    const mapping = await run("docker", ["port", containerName, postgresPort]);
    const port = mapping.slice(mapping.lastIndexOf(":") + 1);
    await callback(
      `postgresql://${databaseUser}:${password}@127.0.0.1:${port}/${databaseName}`,
    );
  } finally {
    process.off("SIGINT", interrupt);
    process.off("SIGTERM", interrupt);
    if (started) await run("docker", ["rm", "--force", containerName]);
  }
}
