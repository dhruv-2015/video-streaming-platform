import {
  createTRPCProxyClient,
  createTRPCReact,
  httpBatchLink,
  TRPCClientError,
} from "@trpc/react-query";
import { env } from "@workspace/env/next";
import { AppRouter } from "@workspace/trpc";
import SuperJSON from "superjson";

export const trpc = createTRPCReact<AppRouter>();
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
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: getUrl(),
    }),
  ],
  transformer: SuperJSON,
});
