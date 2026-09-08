/** @type {import('next').NextConfig} */
const config = {
  distDir: ".next-qualification",
  experimental: { useTypeScriptCli: false },
  output: "standalone",
  poweredByHeader: false,
};

export default config;
