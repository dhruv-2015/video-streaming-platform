// "use client";
// // import { createTRPCClient, httpBatchLink } from "@trpc/client";
// import { QueryClient } from "@tanstack/react-query";
// import { getFetch, httpBatchLink, loggerLink } from "@trpc/client";
// import { createTRPCReact } from "@trpc/react-query";
// import { nextenv as env } from "@workspace/env";
// import { AppRouter } from "@workspace/trpc";
// import { Provider, useState } from "react";
// import SuperJSON from "superjson";
// // import SuperJSON from "superjson";

// const trpc = createTRPCReact<AppRouter>();

// // function TrpcProvider({ children }: { children: React.ReactNode }) {
// //   function getUrl() {
// //     const base = (() => {
// //       if (typeof window !== "undefined") return "";
// //       if (env.NODE_ENV != "development") {
// //         return env.NEXT_PUBLIC_URL;
// //       }
// //       return "http://localhost:3000";
// //     })();
// //     return `${base}/api/trpc`;
// //   }

// //   const queryClient = new QueryClient({
// //     defaultOptions: { queries: { staleTime: 5 * 1000 } },
// //   });

// //   const [trpcClient] = useState(() =>
// //     trpc.createClient({
// //       links: [
// //         loggerLink({
// //           enabled: () => true,
// //         }),
// //         httpBatchLink({
// //           url: getUrl(),
// //           fetch: async (input, init?) => {
// //             const fetch = getFetch();
// //             return fetch(input, {
// //               ...init,
// //               credentials: "include",
// //             });
// //           },
// //           transformer: SuperJSON,
// //         }),
// //       ],
// //     }),
// //   );
// //   // <Provider client={trpcClient} queryClient={queryClient}>
// //   // //   <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
// //   // </Provider>

// //   return (
// //     <Provider client={trpcClient} queryClient={queryClient}>
// //       {children}
// //     </Provider>
// //   );
// // }


// export default function TrpcProvider({
//     children,
//   }: {
//     children: React.ReactNode;
//   }) {
//     // NOTE: Your production URL environment variable may be different
//     const url = "http://localhost:3000/api/trpc/";
  
//     const [trpcClient] = useState(() =>
//       trpc.createClient({
//         links: [
//           loggerLink({
//             enabled: () => true,
//           }),
//           httpBatchLink({
//             url,
//             fetch: async (input, init?) => {
//               const fetch = getFetch();
//               return fetch(input, {
//                 ...init,
//                 credentials: "include",
//               });
//             },
//             transformer: SuperJSON,
//           }),
//         ],
//       }),
//     );
  
//     return (
//       <trpc.Provider client={trpcClient} queryClient={queryClient}>
//         <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
//       </trpc.Provider>
//     );
//   }
  
