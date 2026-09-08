import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useTypeScriptCli: false,
  },
  output: "standalone",
  outputFileTracingRoot: new URL("../..", import.meta.url).pathname,
  poweredByHeader: false,
  transpilePackages: [
    "@ador/feature-platform-shell",
    "@ador/http",
    "@ador/plugin-kit",
    "@ador/shared",
    "@repo/ui",
  ],
  typedRoutes: true,
};

export default nextConfig;
