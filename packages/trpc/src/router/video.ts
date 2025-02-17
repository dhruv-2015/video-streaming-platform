import { z } from "zod";
import { publicProcedure, router } from "../trpc";
// import { tagsRouter } from "./tags";

export const trpcRouter = router({
  search: publicProcedure.input(z.object({
    query: z.string(),
    sort: z.enum(["RELEVANT", "NEWEST", "OLDEST"]).default("RELEVANT"),
    
    page: z.number().default(1),
    limit: z.number().default(10),
  })).query(async ({ ctx, input }) => {
    
  })
  // tags: tagsRouter
});
