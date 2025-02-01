import { initTRPC } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { authSession } from '@workspace/auth';

export const createContext = async (opts: CreateExpressContextOptions) => {
    const session = await authSession(opts.req, opts.res);
   
    return {
      session,
    };
  };
   
 
export type Context = Awaited<ReturnType<typeof createContext>>;
