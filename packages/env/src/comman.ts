import { z } from "zod";

export const server = {
  LOG: z.string().default("false").transform(v => v === "true"),
  PUBLIC_URL: z
    .string({
      message: "PUBLIC_URL must be a valid URL",
    })
    .url({
      message: "PUBLIC_URL must be a valid URL",
    })
    .default("http://localhost:3000")
    .transform(val => {
      return new URL(val).origin;
    }),
  API_URL: z
    .string({
      message: "API_URL must be a valid URL",
    })
    .url({
      message: "API_URL must be a valid URL",
    })
    .transform(val => {
      if (val.endsWith("/")) return val.slice(0, -1);
      return val;
    }),
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

export const client = {} as const;
