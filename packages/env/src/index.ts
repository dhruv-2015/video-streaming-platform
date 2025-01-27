import { createEnv } from './env';
import { z } from 'zod';

const server = {
  DATABASE_URL: z.string().min(1).url().startsWith('mongodb'),
  PORT: z.string().min(1).transform(Number),
} as const;

const client = {
  NEXT_PUBLIC_API_URL: z.string().min(1).url(),
} as const;

const shared = {
  NODE_ENV: z.enum(['development', 'production', 'test']),
} as const;

export const env = createEnv({
  client,
  server,
  shared,
  clientPrefix: 'NEXT_PUBLIC_',
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    PORT: process.env.PORT,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
});


