import { z } from "zod";
import { createEnv as nextCreateEnv } from "./env/nextjs";
import { client, server } from "./comman";


export const env = nextCreateEnv({
  client: client,
  server:server,
  runtimeEnv: {
    PORT: process.env.PORT,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    API_URL: process.env.API_URL,
    PUBLIC_URL: process.env.PUBLIC_URL,
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
