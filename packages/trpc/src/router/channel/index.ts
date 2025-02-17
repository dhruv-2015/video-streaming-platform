import { z } from "zod";

// import { prisma } from "@workspace/database";

import {
  protectedApiProcedure,
  publicProcedure,
  router,
  protectedApiChannelProcedure,
} from "../../trpc";
import { prisma } from "@workspace/database";
import { TRPCError } from "@trpc/server";
import logger from "../../logger";
import { env } from "@workspace/env";

export const channelRouter = router({
  // video: videoRouter,
  getVideos: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/channel/{channel_id}/video",
        summary: "Get all videos of the channel",
        protect: true,
        tags: ["Channel", "video"],
      },
    })
    .input(
      z.object({
        channel_id: z.string(),
        page: z.number().default(1),
        limit: z.number().default(10),
      }),
    )
    .output(
      z.object({
        videos: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            video_type: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]),
            view_count: z.number(),
            description: z.string(),
            thumbnail_s3_path: z.string().optional(),
            dislike_count: z.number(),
            like_count: z.number(),
            is_banned: z.boolean(),
            is_deleted: z.boolean(),
            is_published: z.boolean(),
            is_ready: z.boolean(),
            channel_id: z.string(),
          }),
        ),
        total: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const channel = await prisma.channel.findUnique({
        where: {
          id: input.channel_id,
        },
      });
      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }
      const is_creater = channel.user_id == ctx.session?.user.id;
      const whereCondition: any = {
        channel_id: channel.id,
        is_deleted: false,
      };
      if (!is_creater) {
        (whereCondition.is_banned = false),
          (whereCondition.is_uploaded = true),
          (whereCondition.is_ready = true),
          (whereCondition.is_published = true);
      }
      try {
        const videos = await prisma.video.findMany({
          where: whereCondition,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        });
        const total = await prisma.video.count({
          where: whereCondition,
        });

        return {
          total,
          videos: videos.map(v => ({
            id: v.id,
            title: v.title,
            video_type: v.video_type as "PUBLIC" | "PRIVATE" | "UNLISTED",
            view_count: Number(v.view_count),
            description: v.description,
            thumbnail_s3_path: v.thumbnail_s3_path?.key || "",
            dislike_count: Number(v.dislike_count),
            like_count: Number(v.like_count),
            is_banned: v.is_banned,
            is_deleted: v.is_deleted,
            is_published: v.is_published,
            is_ready: v.is_ready,
            channel_id: v.channel_id,
          })),
        };
      } catch (error) {
        logger.error("channel.video.getMyVideos", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `something went wrong while fetching videos`,
        });
      }
    }),
  
  getChannel: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/channel/{id}",
        summary: "Get Channel",
        description: "Get Channel",
        protect: false,
        tags: ["Channel"],
      },
    })
    .input(z.object({ id: z.string() }))
    .output(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        image: z.string(),
        description: z.string().optional(),
        subscriber_count: z.number(),
        total_views: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const channel = await prisma.channel.findUnique({
        where: {
          id: input.id,
        },
      });
      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }
      if (ctx.session?.user.id) {
        try {
          const alreadyView = await prisma.channelView.findUnique({
            where: {
              channel_id_user_id: {
                channel_id: input.id,
                user_id: ctx.session.user.id,
              },
            }
          })
  
          if (!alreadyView) {
            await prisma.$transaction([
              prisma.channel.update({
                where: {
                  id: input.id,
                },
                data: {
                  total_views: {
                    increment: 1,
                  },
                },
              }),
              prisma.channelView.create({
                data: {
                  channel_id: input.id,
                  user_id: ctx.session.user.id,
                }
              })
            ])
          }
        } catch (error) {
          logger.error("channel.get channel view count increment failed", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong while fetching channel",
          });
          
        }
      }
      return {
        id: channel.id,
        name: channel.name,
        slug: channel.slug,
        image: `${env.S3_PUBLIC_ENDPOINT}/${channel.image}`,
        description: channel.description,
        subscriber_count: channel.subscriber_count,
        total_views: channel.total_views,
      };
    }),
});
