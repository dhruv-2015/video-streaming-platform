import { nextenv as env } from "@workspace/env";
import { NextConfig } from "next";
const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/*"],
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
          destination: env.NEXT_PUBLIC_API_URL + "/api/:path*",
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
