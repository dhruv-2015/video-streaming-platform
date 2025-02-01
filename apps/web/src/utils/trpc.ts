import { createTRPCReact } from '@trpc/react-query';
import { AppRouter } from '@workspace/trpc';

export const trpc = createTRPCReact<AppRouter>();


import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import React, { useState } from 'react';
import SuperJSON from 'superjson';
// import { trpc } from './utils/trpc';
const Provider =  trpc.Provider;
export function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: 'http://localhost:3000/trpc',
          // You can pass any HTTP headers you wish here
        //   async headers() {
        //     return {
        //       authorization: getAuthCookie(),
        //     };
        //   },
        transformer: SuperJSON
        }),
      ],
    }),
  );
  return (
    <Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {/* Your app here */}
      </QueryClientProvider>
    </Provider>
  );
}