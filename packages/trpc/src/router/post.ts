
import { z } from "zod";

// import { prisma } from "@workspace/database";

import { protectedProcedure, publicProcedure, router } from "../trpc";

export const postRouter = router({
  getPost: publicProcedure.query(async ({ctx, input}) => {
      return {
          posts: [
            {id: 1, name: 'test'},
            {id: 2, name: 'test2'}
          ]
      }
  }),
  createPost: protectedProcedure.input(z.object({
    title: z.string(),
    content: z.string(),
  })).mutation(async ({ctx, input}) => {
    return {
      id: 1,
      title: input.title,
      content: input.content,
    }
  }),
})


// export const postRouter = {
//   all: publicProcedure.query(({ ctx }) => {
//     // return ctx.db.select().from(schema.post).orderBy(desc(schema.post.id));
//     return ctx.db.query.Post.findMany({
//       orderBy: desc(Post.id),
//       limit: 10,
//     });
//   }),

//   byId: publicProcedure
//     .input(z.object({ id: z.string() }))
//     .query(({ ctx, input }) => {
//       // return ctx.db
//       //   .select()
//       //   .from(schema.post)
//       //   .where(eq(schema.post.id, input.id));

//       return ctx.db.query.Post.findFirst({
//         where: eq(Post.id, input.id),
//       });
//     }),

//   create: protectedProcedure
//     .input(CreatePostSchema)
//     .mutation(({ ctx, input }) => {
//       return ctx.db.insert(Post).values(input);
//     }),

//   delete: protectedProcedure.input(z.string()).mutation(({ ctx, input }) => {
//     return ctx.db.delete(Post).where(eq(Post.id, input));
//   }),
// } satisfies TRPCRouterRecord;
