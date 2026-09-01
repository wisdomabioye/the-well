import { cp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const applicationRoot = resolve(import.meta.dirname, "..");
const standaloneRoot = resolve(applicationRoot, ".next/standalone/apps/web");

async function replaceDirectory(source: string, destination: string) {
  await rm(destination, { force: true, recursive: true });
  await cp(source, destination, { recursive: true });
}

await Promise.all([
  replaceDirectory(
    resolve(applicationRoot, ".next/static"),
    resolve(standaloneRoot, ".next/static"),
  ),
  replaceDirectory(
    resolve(applicationRoot, "public"),
    resolve(standaloneRoot, "public"),
  ),
]);

await import(pathToFileURL(resolve(standaloneRoot, "server.js")).href);
