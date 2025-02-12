import { env } from "@workspace/env/next";
// import { NextConfig } from "next";

// const { env } = process;
/**
 * @type {import("next").NextConfig}
 */
const nextConfig = {
  // transpilePackages: ["@workspace/ui"],
  output: !!process.env.VERCEL ? "export" :"standalone",
  eslint: {
    ignoreDuringBuilds: true,
    // dirs: ["app", "components", "lib", "trpc", "hooks"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
