// import { nextenv as env } from "@workspace/env";
// import { NextConfig } from "next";

const { env } = process;
const nextConfig = {
  // transpilePackages: ["@workspace/ui"],
  output: "standalone",
  eslint: {
    // dirs: ["app", "components", "lib", "trpc", "hooks"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  rewrites: async () => {
    if (env.NODE_ENV !== "development") {
      return [
        {
          source: "/api/:path*",
          destination: env.NEXT_PUBLIC_URL + "/api/:path*",
        },
      ];
    }
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
