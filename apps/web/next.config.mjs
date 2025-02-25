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
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4568',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'http',
        hostname: "100.85.36.39"
      }
    ],

  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
