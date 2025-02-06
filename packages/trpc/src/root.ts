// // import { authRouter } from "./router/auth";
// // import { postRouter } from "./router/post";
// import { publicProcedure, createTRPCRouter } from "./trpc";

// export const appRouter = createTRPCRouter({
//   // post: postRouter,
//   test: publicProcedure.query(async ({ctx}) => {
//     return {
//       session: ctx.session
//     }
//   })
// });

// export type AppRouter = typeof appRouter;

import { router, publicProcedure } from "./trpc";
import { inferRouterOutputs } from "@trpc/server";
import { userRouter } from "./router/user";
import { z } from "zod";
import { trpcRouter } from "./router";

export const appRouter = trpcRouter;

export type AppRouter = typeof appRouter;
export type AppRouterTypes = inferRouterOutputs<AppRouter>;
