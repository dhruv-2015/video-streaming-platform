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
import { videoRouter } from "./video";
import { env } from "@workspace/env";

export const channelRouter = router({
  video: videoRouter,
  checkChannelSlug: protectedApiProcedure
    .input(z.object({ slug: z.string() }))
    .output(z.boolean())
    .query(async ({ ctx, input }) => {
      try {
        const channel = await prisma.channel.findUnique({
          where: {
            slug: input.slug,
          },
        });
        return !!channel;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "somthing went wrong while searching for channel",
        });
      }
    }),
  createChannel: protectedApiChannelProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/channel",
        summary: "Create Channel",
        description: "Create Channel",
        protect: true,
        tags: ["Channel"],
      },
    })
    .input(
      z.object({
        slug: z.string(),
        name: z.string(),
        description: z.string().optional(),
      }),
    )
    .output(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.channel) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Channel already exists",
        });
      }
      const channel = await prisma.channel.create({
        data: {
          name: input.name,
          slug: input.name,
          user_id: ctx.session.user.id,
          description: input.description,
        },
      });
      return {
        id: channel.id,
        name: channel.name,
        slug: channel.slug,
      };
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
  deleteChannel: protectedApiChannelProcedure.input(z.object({})).output(z.string().optional()).mutation(async ({ ctx }) => {
    if (!ctx.channel) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Channel not found",
      });
    }
    try {
      await prisma.$transaction([
        prisma.video.updateMany({
          data: {
            is_deleted: true,
            delete_reason: "Channel Deleted",
          },
          where: {
            channel_id: ctx.channel.id,
          },
        }),
        prisma.channel.delete({
          where: {
            id: ctx.channel.id,
          },
        }),
        prisma.deletedChannel.create({
          data: {
            channel_id: ctx.channel.id,
            user_id: ctx.channel.user_id,
            name: ctx.channel.name,
            slug: ctx.channel.slug,
            description: ctx.channel.description,
            subscriber_count: ctx.channel.subscriber_count,
            total_views: ctx.channel.total_views,
            createdAt: ctx.channel.createdAt,
            updatedAt: ctx.channel.updatedAt,
          },
        }),
      ]);
      return "channel deleted successfully";
    } catch (error) {
      logger.error("Error deleting channel", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong while deleting channel",
      });
    }
  }),
});
