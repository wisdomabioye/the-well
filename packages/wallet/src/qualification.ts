export const qualifiedLaserEyes = {
  coreVersion: "0.0.85",
  reactVersion: "0.0.80",
} as const;

// The current dependency graph is large; this ceiling prevents unnoticed growth while the provider
// remains route-lazy. It is intentionally close to the first measured 612,547-byte gzip artifact.
export const walletClientBundlePolicy = {
  maximumGzipBytes: 650_000,
  prohibitedMarkers: [
    "node:fs",
    "node:net",
    "node:tls",
    "alkanes-bindgen-cli",
    "createKeystore",
  ],
  prohibitedModuleFragments: ["/esbuild@", "/vite-plugin-ssr@"],
  requiredModuleFragments: [
    `/@omnisat+lasereyes-react@${qualifiedLaserEyes.reactVersion}`,
  ],
} as const;
