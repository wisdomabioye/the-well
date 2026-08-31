import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  hasStrictSafety,
  inheritsBase,
  type TypeScriptConfigContract,
} from "../src/config-contract.js";

const packageRoot = resolve(import.meta.dirname, "..");

async function readConfig(filename: string) {
  return JSON.parse(
    await readFile(resolve(packageRoot, filename), "utf8"),
  ) as TypeScriptConfigContract;
}

describe("TypeScript presets", () => {
  it("keeps the base preset strict", async () => {
    const config = await readConfig("base.json");
    expect(hasStrictSafety(config)).toBe(true);
    expect(hasStrictSafety({})).toBe(false);
  });

  it("keeps framework presets linked to the base preset", async () => {
    const nextConfig = await readConfig("nextjs.json");
    const reactConfig = await readConfig("react-library.json");
    expect(inheritsBase(nextConfig)).toBe(true);
    expect(inheritsBase(reactConfig)).toBe(true);
    expect(inheritsBase({ extends: "./other.json" })).toBe(false);
  });
});
