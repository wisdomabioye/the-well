import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

import { describe, expect, it } from "vitest";
import { build } from "vite";

import { walletClientBundlePolicy } from "../src/qualification.ts";

interface BuildOutput {
  readonly output: readonly {
    readonly code?: string;
    readonly modules?: Readonly<Record<string, object>>;
    readonly type: string;
  }[];
}

function isBuildOutput(result: object): result is BuildOutput {
  return "output" in result;
}

describe("LaserEyes browser bundle", () => {
  it("bundles the React boundary without prohibited server or custody entrypoints", async () => {
    const result = await build({
      build: {
        minify: true,
        rollupOptions: {
          input: fileURLToPath(
            new URL("./fixtures/browser-entry.tsx", import.meta.url),
          ),
        },
        write: false,
      },
      logLevel: "silent",
    });

    const outputs = Array.isArray(result) ? result : [result];
    const chunks: string[] = [];
    const moduleIds: string[] = [];
    for (const output of outputs) {
      if (!isBuildOutput(output)) {
        throw new Error(
          "Wallet qualification unexpectedly entered watch mode.",
        );
      }
      for (const item of output.output) {
        if (item.type === "chunk") {
          chunks.push(item.code ?? "");
          moduleIds.push(...Object.keys(item.modules ?? {}));
        }
      }
    }
    const javascript = chunks.join("\n");

    expect(javascript.length).toBeGreaterThan(0);
    expect(gzipSync(javascript).byteLength).toBeLessThanOrEqual(
      walletClientBundlePolicy.maximumGzipBytes,
    );
    for (const marker of walletClientBundlePolicy.prohibitedMarkers) {
      expect(javascript).not.toContain(marker);
    }
    for (const fragment of walletClientBundlePolicy.prohibitedModuleFragments) {
      expect(moduleIds.some((id) => id.includes(fragment))).toBe(false);
    }
    for (const fragment of walletClientBundlePolicy.requiredModuleFragments) {
      expect(moduleIds.some((id) => id.includes(fragment))).toBe(true);
    }
  });
});
