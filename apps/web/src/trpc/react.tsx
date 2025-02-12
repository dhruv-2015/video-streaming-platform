'use client'


import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'

import React, { useState } from 'react'
import { trpc } from './client'
import SuperJSON from 'superjson'
import { env } from '@workspace/env/next'

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

export const TRPCProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: getUrl(),
        }),
      ],
      transformer: SuperJSON,
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
