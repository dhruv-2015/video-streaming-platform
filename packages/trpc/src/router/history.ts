import { z } from "zod";
// import { prisma } from "@workspace/database";
import { customS3Uploader } from "@workspace/aws";

import { protectedApiProcedure, publicProcedure, router } from "../trpc";
import { prisma } from "@workspace/database";
import { TRPCError } from "@trpc/server";
import { env } from "@workspace/env";
import logger from "../logger";
// import { videoRouter } from "./user/video";
// import { t } from "../trpc";

export const historyRouter = router({
  addVideoToHistory: protectedApiProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/history/add-video",
        summary: "Add video to history",
        tags: ["history"],
        protect: true,
      },
    })
    .input(
      z.object({
        video_id: z.string(),
      }),
    )
    .output(z.void())
    .query(async ({ ctx, input }) => {
      try {
        const view = await prisma.videoView.findUnique({
          where: {
            video_id_user_id: {
              user_id: ctx.session.user.id,
              video_id: input.video_id,
            },
          },
        });
        if (!view) {
          await prisma.$transaction([
            prisma.videoView.create({
              data: {
                user_id: ctx.session.user.id,
                video_id: input.video_id,
              },
            }),
            prisma.video.update({
              data: {
                view_count: {
                  increment: 1,
                },
              },
              where: {
                id: input.video_id,
              },
            }),
          ]);
        }
      } catch (error) {
        logger.error("history.addVideoToHistory fail to add view", error);
      }
      try {
        await prisma.watchHistory.upsert({
            where: {
                user_id_video_id: {
                    user_id: ctx.session.user.id,
                    video_id: input.video_id,
                  },
            },
            update: {
                updatedAt: new Date(),
            },
            create: {
                user_id: ctx.session.user.id,
                video_id: input.video_id,
            }
        })
        
      } catch (error) {
        logger.error("history.addVideoToHistory", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add video to history",
        });
      }
    }),

  getMyHistory: protectedApiProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/history",
        protect: true,
        summary: "Get user watch history",
        tags: ["history"],
      },
    })
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
      }),
    )
    .output(
      z.object({
        total_page: z.number(),
        total_videos: z.number(),
        next_page: z.number().nullable(),
        previos_page: z.number().nullable(),
        videos: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            thumbnail: z.string(),
            duration: z.number(),
            view_count: z.number(),
            created_at: z.date(),
            channel: z.object({
              id: z.string(),
              name: z.string(),
              image: z.string(),
            }),
          }),
        ),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const videoHistory = await prisma.watchHistory.findMany({
          where: {
            user_id: ctx.session.user.id,
            Video: {
              is_banned: false,
              is_deleted: false,
              is_published: true,
              is_ready: true,
            },
          },
          include: {
            Video: {
              select: {
                id: true,
                title: true,
                description: true,
                thumbnail: true,
                VideoFile: {
                  select: {
                    duration: true,
                  },
                },
                view_count: true,
                createdAt: true,
                channel: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          orderBy: {
            updatedAt: "desc",
          },
        });
        console.log(videoHistory);
        
        const totalVideoHistory = await prisma.watchHistory.count({
          where: {
            user_id: ctx.session.user.id,
            Video: {
              is_banned: false,
              is_deleted: false,
              is_published: true,
              is_ready: true,
            },
          },
        });
        const total_pages = Math.ceil(totalVideoHistory / input.limit);
        return {
          total_page: total_pages,
          total_videos: totalVideoHistory,
          next_page: total_pages > input.page ? input.page + 1 : null,
          previos_page: input.page > 1 ? input.page - 1 : null,
          videos: videoHistory.map(view => {
            return {
              id: view.Video.id,
              title: view.Video.title,
              description: view.Video.description,
              thumbnail: view.Video.thumbnail?.key
                ? env.S3_PUBLIC_VIDEO_ENDPOINT + "/" + view.Video.thumbnail.key
                : env.S3_PUBLIC_VIDEO_ENDPOINT + "/thumbnail/default.svg",
              duration: view.Video.VideoFile?.duration ?? 0,
              view_count: Number(view.Video.view_count),
              created_at: view.Video.createdAt,
              channel: {
                id: view.Video.channel.id,
                name: view.Video.channel.name,
                image: view.Video.channel.image?.key
                  ? env.S3_PUBLIC_VIDEO_ENDPOINT +
                    "/" +
                    view.Video.channel.image.key
                  : env.S3_PUBLIC_VIDEO_ENDPOINT + "/thumbnail/default.svg",
              },
            };
          }),
        };
      } catch (error) {
        logger.error("history.geyMyHistory", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get liked videos",
        });
      }
    }),

  removeVideoFromHistory: protectedApiProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/history/remove-video",
        summary: "Remove video from history",
        tags: ["history"],
        protect: true,
      },
    })
    .input(
      z.object({
        video_id: z.string(),
      }),
    )
    .output(z.void())
    .query(async ({ ctx, input }) => {
      try {
        await prisma.videoView.delete({
          where: {
            video_id_user_id: {
              user_id: ctx.session.user.id,
              video_id: input.video_id,
            },
          },
        });
      } catch (error) {
        logger.error("history.removeVideoFromHistory", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove video from history",
        });
      }
    }),
});
