import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-openapi";

import superjson from "superjson";

import { Context } from "./context";
import { ZodError } from "zod";

export const t = initTRPC
  .meta<OpenApiMeta>()
  .context<Context>()
  .create({
    transformer: superjson,
    errorFormatter: ({ shape, error }) => ({
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }),
  });

export const createTRPCRouter = t.router;
export const router = createTRPCRouter;

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev 100-500ms
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

export const publicProcedure = t.procedure.use(timingMiddleware);

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {

    if (ctx.headers.authorization) {
      // verify jtw token
      // const user = await verifyJWT(ctx.headers.authorization);
      // verify jwt in redis and db
      // get userid and email from jwt token
      // return 
      /*
      return next({
        ctx: {
          // infers the `session` as non-nullable
          session: { ...ctx.session, user: {
            id: jwt.id,
            email: jwt.email,
          } },
          headers: ctx.headers
        },
      });
     */
    // problum solved
    }
    
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        // infers the `session` as non-nullable
        session: { ...ctx.session, user: ctx.session.user },
        headers: ctx.headers
      },
    });
  });
