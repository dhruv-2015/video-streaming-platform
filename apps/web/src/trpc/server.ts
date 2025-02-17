import { createTRPCProxyClient, httpBatchLink, TRPCClientError } from "@trpc/client";
import { env } from "@workspace/env/next";
import { AppRouter } from "@workspace/trpc";
import SuperJSON from "superjson";
import { cookies } from 'next/headers';



function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") return "";
    if (env.NODE_ENV != "development") {
      return env.PUBLIC_URL;
    }
    return "http://localhost:3000";
  })();
  return `${base}/api/trpc`;
}

export function isTRPCClientError(
  cause: unknown,
): cause is TRPCClientError<AppRouter> {
  return cause instanceof TRPCClientError;
}


export const trpcServerClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: getUrl(),
      headers() {
        // Forward cookies to your Express server
        return {
          cookie: cookies().toString(),
          // If you're using custom auth headers, add them here
          // authorization: `Bearer ${getServerAuthToken()}`,
        };
      },
    }),
  ],
  transformer: SuperJSON,
});


// trpc.hello.query("world");