import { createTRPCProxyClient, httpBatchLink, TRPCClientError } from "@trpc/client";
import { env } from "@workspace/env/next";
import { AppRouter } from "@workspace/trpc";
import SuperJSON from "superjson";
import { cookies } from 'next/headers';



function getUrl() {
  return `${env.API_URL}/api/trpc`;
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