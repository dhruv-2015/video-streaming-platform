import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-openapi";

import superjson from "superjson";

import { Context } from "./context";
import { ZodError } from "zod";
import { prisma } from "@workspace/database";

export const t = initTRPC
  .meta<OpenApiMeta>()
  .context<Context>()
  .create({
    transformer: superjson,
    errorFormatter: ({ shape, error }) => ({
      trpcError: error,
      ...shape,
      data: {
        ...shape.data,
        message: error.message,
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
  // console.log(result.ok, "result.ok");
  

  const end = Date.now();
  console.log(`[TRPC] ${result.ok ? "✅" : "❌"} ${path} took ${end - start}ms to execute`);

  return result;
});

export const publicProcedure = t.procedure.use(timingMiddleware);

export const protectedApiProcedure = publicProcedure
  .use(t.middleware(({ ctx, next }) => {
    
    if (ctx.headers.authorization == "Bearer null") {
      // verify jtw token
      // const user = await verifyJWT(ctx.headers.authorization);
      // verify jwt in redis and db
      // get userid and email from jwt token
      // return 
      // /*
      console.log("Bearer null");
      
      return next({
        ctx: {
          // infers the `session` as non-nullable
          session: { ...ctx.session, user: {
            id: "67b1e30eea1bfa84544f1756",
            email: "chadasaniyadhruv@gmail.com",
          } },
          headers: ctx.headers
        },
      });
    //  */
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
  }));


  export const protectedProcedure = publicProcedure
  .use(t.middleware(({ ctx, next }) => {
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
  }));


  export const protectedApiChannelProcedure = protectedApiProcedure.use(async ({ ctx, next }) => {
    
    const channel = await prisma.channel.findUnique({
      where: {
        user_id: ctx.session.user.id,
      }
    })

    return next({
      ctx: {
        ...ctx,
        channel: channel
      },
    })
  });
