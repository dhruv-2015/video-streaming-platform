import { httpBatchLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { ssrPrepass } from "@trpc/next/ssrPrepass";
import { nextenv as env } from "@workspace/env";
import type { AppRouter } from "@workspace/trpc";
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

// export const trpc = createTRPCNext<AppRouter>({
//     config() {
//         return {
//           links
//         };
//       },
//       ssr: true,
// });

export const trpc = createTRPCNext<AppRouter>({
  /**
   * @see https://trpc.io/docs/v11/ssr
   **/
  ssr: true,
  ssrPrepass: ssrPrepass,
  config() {
    return {
      links: [httpBatchLink({ url: getUrl(), transformer: SuperJSON })],
    };
  },
  transformer: SuperJSON,
});
