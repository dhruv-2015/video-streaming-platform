import { createEnv } from './env';
import { z } from 'zod';
// import { config } from 'dotenv';
// config({
//   path: "../../../.env.local"
// })

const server = {
  DATABASE_URL: z.string({
    message: 'DATABASE_URL must be a valid MongoDB URL',
  }).url({
    message: 'DATABASE_URL must be a valid MongoDB URL',
  }).startsWith('mongodb',{
    message: 'DATABASE_URL must be a valid MongoDB URL',
  }),
  LOG_DIR: z.string({
    message: 'LOG_DIR must be a valid path',
  }).default("./logs"),
  REDIS_URL: z.string({
    message: 'REDIS_URL must be a valid Redis URL',
  }).min(1).url({
    message: 'REDIS_URL must be a valid Redis URL',
  }).startsWith('redis', {
    message: 'REDIS_URL must be a valid Redis URL',
  }),
  PORT: z.string({
    message: 'PORT must be a valid number',
  }).min(1).transform(Number),
  AUTH_SECRET: z.string({
    message: 'AUTH_SECRET is required and must be at least 10 characters long',
  }).min(10, {
    message: 'AUTH_SECRET is required and must be at least 10 characters long',
  }),
  AUTH_GOOGLE_ID: z.string({
    message: 'AUTH_GOOGLE_ID is required',
  }).min(1, {
    message: 'AUTH_GOOGLE_ID is required',
  }),
  AUTH_GOOGLE_SECRET: z.string({
    message: 'AUTH_GOOGLE_SECRET is required',
  }).min(1, {
    message: 'AUTH_GOOGLE_SECRET is required',
  }),
  NODE_ENV: z.enum(['development', 'production', 'test', 'dev', 'prod'], {
    message: 'NODE_ENV must be one of development, production or test',
  }).default("development").transform((v) => {
    
    if (v === 'development' || v === 'dev') return 'development';
    if (v === 'production' || v === 'prod') return 'production';
    return 'test';
  }),
} as const;

const client = {
  NEXT_PUBLIC_API_URL: z.string({
    message: "NEXT_PUBLIC_API_URL must be a valid URL"
  }).url({
    message: "NEXT_PUBLIC_API_URL must be a valid URL"
  }).transform(val => {
    if (val.endsWith("/")) return val.slice(0, -1);
    return val;
  }),
} as const;

const shared = {
  
} as const;

export const env = createEnv({
  client,
  server,
  clientPrefix: 'NEXT_PUBLIC_',
  shared,
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    PORT: process.env.PORT,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    LOG_DIR: process.env.LOG_DIR,
  },

  isServer: typeof window === 'undefined',
  onInvalidAccess: (error) => {
    console.log("error", error);
    process.exit(1);

  },

  onValidationError: (error) => {
    console.error(error.map(e => `❌ ${e.message} - env:${e.path?.join(" - ")}`).join('\n'));
    process.exit(1);
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI
});




