import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const packageDirectory = fileURLToPath(new URL("..", import.meta.url));
const fixtureDirectory = fileURLToPath(
  new URL("./fixtures/next-app", import.meta.url),
);
const outputDirectory = `${fixtureDirectory}/.next-qualification`;
const generatedTypes = `${fixtureDirectory}/next-env.d.ts`;
const standaloneServer = `${outputDirectory}/standalone/packages/wallet/test/fixtures/next-app/server.js`;

rmSync(outputDirectory, { force: true, recursive: true });
try {
  execFileSync("pnpm", ["exec", "next", "build", fixtureDirectory], {
    cwd: packageDirectory,
    stdio: "inherit",
  });
  if (
    !existsSync(`${outputDirectory}/BUILD_ID`) ||
    !existsSync(standaloneServer)
  ) {
    throw new Error(
      "Next.js did not emit the qualified standalone server artifacts.",
    );
  }
} finally {
  rmSync(outputDirectory, { force: true, recursive: true });
  rmSync(generatedTypes, { force: true });
}
