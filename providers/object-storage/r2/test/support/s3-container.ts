import { randomUUID } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const minioImage =
  "quay.io/minio/minio:RELEASE.2025-09-07T16-13-09Z@sha256:14cea493d9a34af32f524e538b8346cf79f3321eff8e708c1e2960462bd8936e";
const minioPort = "9000/tcp";
const accessKeyId = "ador-test-access";

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

async function waitUntilReady(endpoint: string): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${endpoint}/minio/health/ready`);
      if (response.ok) return;
    } catch {
      // The disposable service may not have bound its port yet.
    }
    await delay(500);
  }
  throw new Error("S3 conformance service did not become ready.");
}

export interface S3TestEnvironment {
  readonly accessKeyId: string;
  readonly endpoint: string;
  readonly secretAccessKey: string;
}

export async function withDisposableS3(
  callback: (environment: S3TestEnvironment) => Promise<void>,
): Promise<void> {
  const containerName = `ador-s3-${randomUUID()}`;
  const secretAccessKey = randomUUID();
  let started = false;
  const removeSync = () => {
    if (!started) return;
    spawnSync("docker", ["rm", "--force", containerName], { stdio: "ignore" });
    started = false;
  };
  const interrupt = (signal: NodeJS.Signals) => {
    removeSync();
    process.kill(process.pid, signal);
  };
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);
  try {
    await run("docker", [
      "run",
      "--detach",
      "--name",
      containerName,
      "--env",
      `MINIO_ROOT_USER=${accessKeyId}`,
      "--env",
      `MINIO_ROOT_PASSWORD=${secretAccessKey}`,
      "--publish",
      "127.0.0.1::9000",
      minioImage,
      "server",
      "/data",
    ]);
    started = true;
    const mapping = await run("docker", ["port", containerName, minioPort]);
    const port = mapping.slice(mapping.lastIndexOf(":") + 1);
    const endpoint = `http://127.0.0.1:${port}`;
    await waitUntilReady(endpoint);
    await callback({ accessKeyId, endpoint, secretAccessKey });
  } finally {
    process.off("SIGINT", interrupt);
    process.off("SIGTERM", interrupt);
    if (started) await run("docker", ["rm", "--force", containerName]);
  }
}
