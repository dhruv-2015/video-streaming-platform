import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { prisma } from "@workspace/database";
import { TRPCError } from "@trpc/server";
import logger from "../logger";
import { env } from "@workspace/env";
// import { tagsRouter } from "./tags";

export const trpcRouter = router({
  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        sort: z.enum(["RELEVANT", "NEWEST", "OLDEST"]).default("RELEVANT"),

        page: z.number().default(1),
        limit: z.number().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {}),
  getVideo: publicProcedure
    .input(
      z.object({
        video_id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      input.video_id;
      try {
        const video = await prisma.video.findUnique({
          where: {
            id: input.video_id,
            is_ready: true,
            is_deleted: false,
            is_banned: false,
            is_published: true,
          },
        });
        if (!video) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video not found",
          });
        }
        if (ctx.session?.user.id) {
          await prisma.videoView.create({
            data: {
              user_id: ctx.session.user.id,
              video_id: video.id,
            },
          });
        }
        video.title
        return {
          id: video.id,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnail ? `${env.S3_PUBLIC_VIDEO_ENDPOINT}/${video.thumbnail.key}` : env.S3_PUBLIC_VIDEO_ENDPOINT + "/thumbnail/default.svg",
          like_count: video.like_count,
          channel_id: video.channel_id,


        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error("video.getVideo", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),
  // tags: tagsRouter
});
