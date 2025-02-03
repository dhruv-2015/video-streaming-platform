import { initTRPC } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { authSession } from '@workspace/auth';
import { Request } from 'express';

export const createContext = async (opts: CreateExpressContextOptions) => {
    const session = await authSession(opts.req, opts.res);
   
    return {
      headers: opts.req.headers,
      session,
    };
  };
   
 
export type Context = Awaited<ReturnType<typeof createContext>>;
