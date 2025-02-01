"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { trpc } from "@/trpc/client";
// import { CreateTRPCReact } from "@trpc/react-query";


let clientQueryClientSingleton: QueryClient;
function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return new QueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= new QueryClient());
}


export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        enableColorScheme
      >
        <QueryClientProvider client={queryClient}>
          {/* {trpc.withTRPC()} */}
          {/* {trpc} */}
          {/* <TRPCProvider client={client}> */}
      {children}
    {/* </TRPCProvider> */}
          {/* {children} */}
        </QueryClientProvider>
      </NextThemesProvider>
    </SessionProvider>
  );
}
