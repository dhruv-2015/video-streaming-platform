import { z } from "zod";
import { createEnv as nextCreateEnv } from "./env/nextjs";

export const next_server = {
    AUTH_SECRET: z
      .string({
        message:
          "AUTH_SECRET is required and must be at least 10 characters long",
      })
      .min(10, {
        message:
          "AUTH_SECRET is required and must be at least 10 characters long",
      }),
    AUTH_GOOGLE_ID: z
      .string({
        message: "AUTH_GOOGLE_ID is required",
      })
      .min(1, {
        message: "AUTH_GOOGLE_ID is required",
      }),
    AUTH_GOOGLE_SECRET: z
      .string({
        message: "AUTH_GOOGLE_SECRET is required",
      })
      .min(1, {
        message: "AUTH_GOOGLE_SECRET is required",
      }),
    NODE_ENV: z
      .enum(["development", "production", "test", "dev", "prod"], {
        message: "NODE_ENV must be one of development, production or test",
      })
      .default("development")
      .transform(v => {
        if (v === "development" || v === "dev") return "development";
        if (v === "production" || v === "prod") return "production";
        return "test";
      }),
    PORT: z
      .string({
        message: "PORT must be a valid number",
      })
      .min(1)
      .transform(Number),
  };

  export const client = {
    NEXT_PUBLIC_URL: z
      .string({
        message: "NEXT_PUBLIC_URL must be a valid URL",
      })
      .url({
        message: "NEXT_PUBLIC_URL must be a valid URL",
      })
      .default("http://localhost:3000")
      .transform(val => {
        return new URL(val).origin;
      }),
    NEXT_PUBLIC_API_URL: z
      .string({
        message: "NEXT_PUBLIC_API_URL must be a valid URL",
      })
      .url({
        message: "NEXT_PUBLIC_API_URL must be a valid URL",
      })
      .transform(val => {
        if (val.endsWith("/")) return val.slice(0, -1);
        return val;
      }),
  } as const;


export const env = nextCreateEnv({
  client,
  server: next_server,
  runtimeEnv: {
    PORT: process.env.PORT,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
  },
  onInvalidAccess: error => {
    console.log("error", error);
    process.exit(1);
  },
  onValidationError: error => {
    console.error(
      error.map(e => `❌ ${e.message} - env:${e.path?.join(" - ")}`).join("\n"),
    );
    process.exit(1);
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
});
