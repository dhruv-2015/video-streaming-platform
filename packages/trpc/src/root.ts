// import { authRouter } from "./router/auth";
import { postRouter } from "./router/post";
import { publicProcedure, router } from "./trpc";

export const appRouter = router({
  post: postRouter,
  test: publicProcedure.query(async ({ctx}) => {
    return {
      session: ctx.session
    }
  })
});

export type AppRouter = typeof appRouter;
