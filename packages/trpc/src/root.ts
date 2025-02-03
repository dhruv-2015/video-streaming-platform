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


import { router, publicProcedure } from './trpc';
import {inferRouterOutputs} from '@trpc/server';
import { z } from 'zod';

export const appRouter = router({
  hello: publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/hello",
    }
  })
    .input(z.object({
      input: z.string().optional(),
    }))
    .output(z.string())
    .query(({ input }) => {
      return `Hello ${input.input ?? 'World'}`;
    }),
});

export type AppRouter = typeof appRouter;
export type AppRouterTypes = inferRouterOutputs<AppRouter>;