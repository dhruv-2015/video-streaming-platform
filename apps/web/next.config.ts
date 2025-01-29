/** @type {import('next').NextConfig} */
import {env} from "@workspace/env"
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  output: "standalone",
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
}

export default nextConfig
