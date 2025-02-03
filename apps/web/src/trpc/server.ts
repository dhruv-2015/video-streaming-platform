import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { env } from "@workspace/env/next";
import { AppRouter } from "@workspace/trpc";
import SuperJSON from "superjson";

function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") return "";
    if (env.NODE_ENV != "development") {
      return env.NEXT_PUBLIC_URL;
    }
    return "http://localhost:3000";
  })();
  return `${base}/api/trpc`;
}

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: getUrl(),
    }),
  ],
  transformer: SuperJSON,
});

// trpc.hello.query("world");