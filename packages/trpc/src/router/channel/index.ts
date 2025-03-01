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
        query: z.string().default(""),
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
            thumbnail: z.string(),
            dislike_count: z.number(),
            like_count: z.number(),
            comment_count: z.number(),
            is_banned: z.boolean(),
            is_deleted: z.boolean(),
            is_published: z.boolean(),
            is_ready: z.boolean(),
            channel_id: z.string(),
            created_at: z.string(),
            published_at: z.string().nullable(),
          }),
        ),
        total_page: z.number(),
        total_videos: z.number(),
        next_page: z.number().nullable(),
        prev_page: z.number().nullable(),
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
      console.log(is_creater);

      const whereCondition: any = {
        channel_id: channel.id,
        is_deleted: false,
        is_uploaded: true,
      };
      if (!is_creater) {
        (whereCondition.is_banned = false),
          (whereCondition.is_ready = true),
          (whereCondition.is_published = true);
      }
      if (input.query != "") {
        whereCondition.title = {
          contains: input.query,
          mode: "insensitive",
        };
      }
      try {
        const videos = await prisma.video.findMany({
          where: whereCondition,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            _count: {
              select: {
                VideoComment: true,
              },
            },
          },
        });
        const total = await prisma.video.count({
          where: whereCondition,
        });
        const total_page = Math.ceil(total / input.limit);
        return {
          total_page,
          total_videos: total,
          next_page: input.page < total_page ? input.page + 1 : null,
          prev_page: input.page > 1 ? input.page - 1 : null,
          videos: videos.map(v => ({
            id: v.id,
            title: v.title,
            video_type: v.video_type as "PUBLIC" | "PRIVATE" | "UNLISTED",
            view_count: Number(v.view_count),
            description: v.description,
            thumbnail: v.thumbnail
              ? `${env.S3_PUBLIC_VIDEO_ENDPOINT}/${v.thumbnail.key}`
              : env.S3_PUBLIC_VIDEO_ENDPOINT + "/thumbnail/default.svg",
            dislike_count: Number(v.dislike_count),
            like_count: Number(v.like_count),
            comment_count: v._count.VideoComment,
            is_banned: v.is_banned,
            is_deleted: v.is_deleted,
            is_published: v.is_published,
            is_ready: v.is_ready,
            channel_id: v.channel_id,
            created_at: v.createdAt.toISOString(),
            published_at: v.published_at?.toISOString() ?? null,
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
        path: "/channel/{channel_slug}",
        summary: "Get Channel",
        description: "Get Channel",
        protect: false,
        tags: ["Channel"],
      },
    })
    .input(z.object({ channel_slug: z.string() }))
    .output(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        image: z.string(),
        description: z.string(),
        subscriber_count: z.number(),
        total_views: z.number(),
        total_videos: z.number(),
        join_at: z.date(),
        is_subscribed: z.boolean(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const channel = await prisma.channel.findUnique({
        where: {
          slug: input.channel_slug,
        },
        include: {
          _count: {
            select: {
              Videos: {
                where: {
                  is_deleted: false,
                  is_banned: false,
                  is_published: true,
                  is_ready: true,
                },
              },
            },
          },
        },
      });
      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      // Check if user is subscribed to the channel
      let is_subscribed = false;
      if (ctx.session?.user.id) {
        try {
          const subscription = await prisma.channelSubscription.findUnique({
            where: {
              channel_id_user_id: {
                channel_id: channel.id,
                user_id: ctx.session.user.id,
              },
            },
          });
          
          is_subscribed = !!subscription;

          const alreadyView = await prisma.channelView.findUnique({
            where: {
              channel_id_user_id: {
                channel_id: channel.id,
                user_id: ctx.session.user.id,
              },
            },
          });

          if (!alreadyView) {
            await prisma.$transaction([
              prisma.channel.update({
                where: {
                  id: channel.id,
                },
                data: {
                  total_views: {
                    increment: 1,
                  },
                },
              }),
              prisma.channelView.create({
                data: {
                  channel_id: channel.id,
                  user_id: ctx.session.user.id,
                },
              }),
            ]);
          }
        } catch (error) {
          logger.error(
            "channel.get channel view count increment failed",
            error,
          );
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
        image: channel.image
          ? `${env.S3_PUBLIC_ENDPOINT}/${channel.image.key}`
          : `${env.S3_PUBLIC_VIDEO_ENDPOINT}/thumbnail/default.svg`,
        description: channel.description,
        subscriber_count: channel.subscriber_count,
        total_views: channel.total_views,
        total_videos: channel._count.Videos,
        join_at: channel.createdAt,
        is_subscribed,
      };
    }),
  getPlaylist: publicProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        channel_id: z.string(),
      }),
    )
    .output(
      z.object({
        total_page: z.number(),
        total_playlist: z.number(),
        next_page: z.number().nullable(),
        previos_page: z.number().nullable(),
        playlists: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            total_videos: z.number(),
            thumbnail: z.string(),
            created_at: z.string(),
          }),
        ),
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
      const playlists = await prisma.playlist.findMany({
        where: {
          creater_id: channel.user_id,
          is_private: false,
        },
        include: {
          _count: {
            select: {
              PlaylistVideo: true,
            },
          },
          PlaylistVideo: {
            select: {
              video: {
                select: {
                  thumbnail: true,
                },
              },
            },
            take: 1,
          },
        },
      });
      const total_playlist = await prisma.playlist.count({
        where: {
          creater_id: channel.user_id,
          is_private: false,
        },
      });
      const total_page = Math.ceil(total_playlist / input.limit);
      return {
        next_page: input.page < total_page ? input.page + 1 : null,
        previos_page: input.page > 1 ? input.page - 1 : null,
        total_page,
        total_playlist,
        playlists: playlists.map(playlist => ({
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          total_videos: playlist._count.PlaylistVideo,
          thumbnail: playlist.PlaylistVideo[0]?.video.thumbnail
            ? `${env.S3_PUBLIC_VIDEO_ENDPOINT}/${playlist.PlaylistVideo[0]?.video.thumbnail.key}`
            : `${env.S3_PUBLIC_VIDEO_ENDPOINT}/thumbnail/default.svg`,
          created_at: playlist.createdAt.toISOString(),
        })),
      };
    }),
  subscribeChannel: protectedApiProcedure
    .input(
      z.object({
        channel_id: z.string(),
        doSubscribe: z.boolean({
          message: "true for subscribe, false for unsubscribe",
        }),
      }),
    )
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      try {
        const oldSubscribtion = await prisma.channelSubscription.findUnique({
          where: {
            channel_id_user_id: {
              channel_id: input.channel_id,
              user_id: ctx.session.user.id,
            },
          },
        });
        if (input.doSubscribe) {
          if (oldSubscribtion) return;

          await prisma.$transaction([
            prisma.channelSubscription.create({
              data: {
                channel_id: input.channel_id,
                user_id: ctx.session.user.id,
              },
            }),
            prisma.channel.update({
              where: {
                id: input.channel_id,
              },
              data: {
                subscriber_count: {
                  increment: 1,
                },
              },
            }),
          ]);
          return;
        } else {
          if (!oldSubscribtion) return;
          await prisma.$transaction([
            prisma.channelSubscription.delete({
              where: {
                channel_id_user_id: {
                  channel_id: input.channel_id,
                  user_id: ctx.session.user.id,
                },
              },
            }),
            prisma.channel.update({
              where: {
                id: input.channel_id,
              },
              data: {
                subscriber_count: {
                  decrement: 1,
                },
              },
            }),
          ]);
          return;
        }
      } catch (error) {
        logger.error("channel.subscribeChannel", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong while subscribing channel",
        });
      }
    }),
});
