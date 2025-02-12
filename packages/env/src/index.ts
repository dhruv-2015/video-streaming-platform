import { createEnv } from "./env";
import { z } from "zod";
import { client, server as next_server } from "./comman";

const server = {
  ...next_server,
  DATABASE_URL: z
    .string({
      message: "DATABASE_URL must be a valid MongoDB URL",
    })
    .url({
      message: "DATABASE_URL must be a valid MongoDB URL",
    })
    .startsWith("mongodb", {
      message: "DATABASE_URL must be a valid MongoDB URL",
    }),
  LOG_DIR: z
    .string({
      message: "LOG_DIR must be a valid path",
    })
    .default("./logs"),
  REDIS_URL: z
    .string({
      message: "REDIS_URL must be a valid Redis URL",
    })
    .min(1)
    .url({
      message: "REDIS_URL must be a valid Redis URL",
    })
    .startsWith("redis", {
      message: "REDIS_URL must be a valid Redis URL",
    }),
  PORT: z
    .string({
      message: "PORT must be a valid number",
    })
    .min(1)
    .transform(Number),
  S3_ENDPOINT: z.string({
    message: "S3_ENDPOINT is required",
  }).url({
    message: "S3_ENDPOINT MUST be a valid URL",
  }),
  S3_REGION: z.string({
    message: "S3_REGION is required",
  }).min(1, {
    message: "S3_REGION is required",
  }),
  S3_ACCESS_KEY_ID: z.string({
    message: "S3_ACCESS_KEY_ID is required",
  }).min(1, {
    message: "S3_ACCESS_KEY_ID is required",
  }),
  S3_ACCESS_KEY_SECRET: z.string({
    message: "S3_ACCESS_KEY_SECRET is required",
  }).min(1, {
    message: "S3_ACCESS_KEY_SECRET is required",
  }),
  S3_FILES_BUCKET: z.string({
    message: "S3_FILES_BUCKET is required",
  }).min(1, {
    message: "S3_FILES_BUCKET is required",
  }),
  S3_VIDEO_BUCKET: z.string({
    message: "S3_VIDEO_BUCKET is required",
  }).min(1, {
    message: "S3_VIDEO_BUCKET is required",
  }),
  S3_PUBLIC_ENDPOINT: z.string({
    message: "S3_PUBLIC_ENDPOINT is required",
  }).url({
    message: "S3_PUBLIC_ENDPOINT MUST be a valid URL",
  }),
  S3_PUBLIC_VIDEO_ENDPOINT: z.string({
    message: "S3_PUBLIC_VIDEO_ENDPOINT is required",
  }).url({
    message: "S3_PUBLIC_VIDEO_ENDPOINT MUST be a valid URL",
  }),
  CHROMADB_URL: z.string({
    message: "CHROMADB_URL is required",
  }).url({
    message: "CHROMADB_URL MUST be a valid URL",
  }),
} as const;



const shared = {} as const;
declare const window: any;
export const env = createEnv({
  client,
  server,
  clientPrefix: "NEXT_PUBLIC_",
  shared,
  // runtimeEnv: {
  //   DATABASE_URL: process.env.DATABASE_URL,
  //   REDIS_URL: process.env.REDIS_URL,
  //   PORT: process.env.PORT,
  //   AUTH_SECRET: process.env.AUTH_SECRET,
  //   AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
  //   AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
  //   NODE_ENV: process.env.NODE_ENV,
  //   NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  //   LOG_DIR: process.env.LOG_DIR,
  // },
  runtimeEnv: process.env,

  isServer: typeof window === "undefined",
  onInvalidAccess: error => {
    console.error("error", error);
    throw new Error(error)
  },

  onValidationError: error => {
    const msg = error.map(e => `❌ ${e.message} - env:${e.path?.join(" - ")}`).join("\n")
    console.error(
      msg
    );
    throw new Error(msg)
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
});

