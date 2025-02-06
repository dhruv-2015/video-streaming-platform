import { z } from "zod";

// import { prisma } from "@workspace/database";

import {
  protectedApiProcedure,
  publicProcedure,
  router,
  protectedApiChannelProcedure,
  t,
} from "../../trpc";
import { prisma } from "@workspace/database";
import { TRPCError } from "@trpc/server";
import { customS3Uploader } from "@workspace/aws";
import logger from "../../logger";
import { env } from "@workspace/env";
import { recomandationSystem } from "@workspace/services";

export const videoRouter = router({
  getMyVideos: publicProcedure
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
  getVideo: protectedApiChannelProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/channel/video/{id}",
        summary: "Get video by id for creaters only",
        protect: true,
        tags: ["Channel", "video"],
      },
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .output(
      z.object({
        id: z.string(),
        title: z.string(),
        video_type: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]),
        view_count: z.number(),
        description: z.string(),
        thumbnail_s3_path: z.string().optional(),
        avalable_thumbnail_s3_path: z.array(z.string()),
        dislike_count: z.number(),
        like_count: z.number(),
        is_banned: z.boolean(),
        error_message: z.string().optional(),
        banned_reason: z.string().optional(),
        is_deleted: z.boolean(),
        deleted_reason: z.string().optional(),
        is_published: z.boolean(),
        is_ready: z.boolean(),
        channel_id: z.string(),
        is_uploaded: z.boolean(),
        m3u8_url_s3_path: z.string().optional(),
        duration: z.number().optional(),
        audio_channels: z.number().optional(),
        tags: z.array(z.string()),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }
      try {
        const video = await prisma.video.findUnique({
          where: {
            id: input.id,
            channel_id: ctx.channel.id,
          },
          include: {
            VideoFile: true,
            VideoTags: {
              select: {
                tag: true,
              },
            },
          },
        });
        if (!video) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video not found",
          });
        }
        return {
          id: video.id,
          title: video.title,
          avalable_thumbnail_s3_path: video.avalable_thumbnail_s3_path.map(
            v => v.key,
          ),
          error_message: video.error_message ?? undefined,
          channel_id: video.channel_id,
          description: video.description,
          dislike_count: Number(video.dislike_count),
          is_banned: video.is_banned,
          deleted_reason: video.delete_reason ?? undefined,
          banned_reason: video.banned_reason ?? undefined,
          is_deleted: video.is_deleted,
          is_published: video.is_published,
          is_ready: video.is_ready,
          like_count: Number(video.like_count),
          is_uploaded: video.is_uploaded,
          video_type: video.video_type as "PUBLIC" | "PRIVATE" | "UNLISTED",
          view_count: Number(video.view_count),
          thumbnail_s3_path: video.thumbnail_s3_path?.key || "",
          m3u8_url_s3_path: video.VideoFile?.m3u8_url_s3_path.key ?? undefined,
          duration: video.VideoFile?.duration ?? undefined,
          audio_channels: video.VideoFile?.audio_channels ?? undefined,
          tags: video.VideoTags.map(v => v.tag),
        };
      } catch (error) {
        logger.error("channel.video.getVideo", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `something went wrong while fetching video`,
        });
      }
    }),

  createVideo: protectedApiChannelProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/channel/video",
        summary: "Create video",
        protect: true,
        tags: ["Channel", "video"],
      },
    })
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .output(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }
      try {
        const res = await prisma.$transaction(async p => {
          const tags = input.tags || [];

          const video = await p.video.create({
            data: {
              channel_id: ctx.channel!.id,
              title: input.title,
              description: input.description,
              VideoTags: {
                connectOrCreate: tags.map(tag => ({
                  where: { tag: tag },
                  create: { tag: tag },
                })),
              },
            },
          });
          await recomandationSystem.addOrUpdateVideo(
            video.id,
            video.title,
            video.description,
            tags,
          );
          return {
            id: video.id,
          };
        });

        return res;
      } catch (error) {
        logger.error("channel.video.createVideo", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `something went wrong while creating video`,
        });
      }
    }),

  updateTags: protectedApiChannelProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/channel/video/{video_id}/update-tags",
        protect: true,
        summary: "Update tags of video",
      },
    })
    .input(
      z.object({
        video_id: z.string(),
        tags: z.array(z.string()),
      }),
    )
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }
      try {
        const video = await prisma.video.findUnique({
          where: {
            id: input.video_id,
            channel_id: ctx.channel.id,
          },
          include: {
            VideoTags: {
              select: {
                tag: true,
              },
            },
          },
        });
        if (!video) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video not found",
          });
        }
        const tags = input.tags || [];
        const tagsToAdd = tags.filter(
          tag => !video.VideoTags.find(vt => vt.tag === tag),
        );
        const tagsToDelete = video.VideoTags.filter(
          vt => !tags.includes(vt.tag),
        );
        await prisma.$transaction(async p => {
          const video = await p.video.update({
            where: {
              id: input.video_id,
            },
            data: {
              VideoTags: {
                disconnect: tagsToDelete,
                connectOrCreate: tagsToAdd.map(tag => ({
                  where: { tag: tag },
                  create: { tag: tag },
                })),
              },
            },
            select: {
              title: true,
              VideoTags: {
                select: {
                  tag: true,
                },
              },
              description: true,
              id: true,
            },
          });
          await recomandationSystem.addOrUpdateVideo(
            video.id,
            video.title,
            video.description,
            video.VideoTags.map(vt => vt.tag),
          );
          return;
        });

        return;
      } catch (error) {
        logger.error("channel.video.updateTags", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `something went wrong while updating tags`,
        });
      }
    }),

  getPresignedUrlForVideo: protectedApiChannelProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/channel/video/{video_id}/presigned-url",
        protect: true,
        summary: "Get presigned url for video",
        tags: ["Channel", "video"],
      },
    })
    .input(
      z.object({
        video_id: z.string(),
        file_name: z.string(),
      }),
    )
    .output(
      z.object({
        url: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }
      try {
        const video = await prisma.video.findUnique({
          where: {
            id: input.video_id,
          },
        });
        if (!video || video.channel_id !== ctx.channel.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video not found",
          });
        }
        if (video.is_ready || video.is_uploaded || video.is_published) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Video is already uploaded",
          });
        }
        if (video.orignal_file) {
          const s3url = await customS3Uploader.generatePresignedUrl({
            bucket: video.orignal_file.bucket,
            for: "video",
            path: video.orignal_file.key,
          });
          return {
            url: s3url.url,
          };
        }
      } catch (error) {
        logger.error("channel.video.getPresignedUrlForVideo", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong while getting video",
        });
      }
      try {
        const res = await prisma.$transaction(async p => {
          const s3url = await customS3Uploader.generatePresignedUrl({
            bucket: env.S3_VIDEO_BUCKET,
            fileName: input.file_name,
            for: "video",
          });
          await p.video.update({
            where: {
              id: input.video_id,
            },
            data: {
              orignal_file: {
                bucket: s3url.s3Data.bucket,
                key: s3url.s3Data.key,
              },
            },
          });
          return {
            url: s3url.url,
          };
        });
        return res;
      } catch (error) {
        logger.error("channel.video.getPresignedUrlForVideo", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong while getting video information",
        });
      }
    }),
  verifyVideoUpload: protectedApiChannelProcedure // add video to queue
    .meta({
      openapi: {
        method: "PATCH",
        path: "/channel/video/{video_id}/verify-upload",
        protect: true,
        summary: "Verify video upload",
        tags: ["Channel", "video"],
      },
    })
    .input(
      z.object({
        video_id: z.string(),
      }),
    )
    .output(z.string().optional())
    .query(async ({ ctx, input }) => {
      if (!ctx.channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }
      try {
        const video = await prisma.video.findUnique({
          where: {
            id: input.video_id,
          },
        });
        if (!video || video.channel_id !== ctx.channel.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video not found",
          });
        }
        if (video.is_ready || video.is_uploaded || video.is_published) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Video is already uploaded",
          });
        }
        if (!video.orignal_file) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Video file not found. please upload video first",
          });
        }
        try {
          const res = await customS3Uploader.checkFileExists({
            bucket: video.orignal_file.bucket,
            key: video.orignal_file.key,
          });
          if (res) {
            await prisma.video.update({
              where: {
                id: input.video_id,
              },
              data: {
                is_uploaded: true,
              },
            });
            return "Video uploaded successfully";
          } else {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Video file not found on server. please upload video first",
            });
          }
        } catch (error) {
          logger.error("channel.video.verifyVideoUpload", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "something went wrong while updating video",
          });
        }
      } catch (error) {
        logger.error("channel.video.verifyVideoUpload", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong",
        });
      }
    }),
  publishVideo: protectedApiChannelProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/channel/video/{video_id}/publish",
        protect: true,
        summary: "Verify video upload",
        tags: ["Channel", "video"],
      },
    })
    .input(
      z.object({
        video_id: z.string(),
      }),
    )
    .output(z.string().optional())
    .query(async ({ ctx, input }) => {
      if (!ctx.channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }
      const video = await prisma.video.findUnique({
        where: {
          id: input.video_id,
        },
      });
      if (!video || video.channel_id !== ctx.channel.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video not found",
        });
      }
      if (!video.is_uploaded) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Video is not uploaded. please upload video first",
        });
      }
      if (!video.is_ready) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Video is not ready yet. please wait",
        });
      }
      try {
        await prisma.video.update({
          where: {
            id: input.video_id,
          },
          data: {
            is_published: true,
          },
        });

        return "Video published successfully";
      } catch (error) {
        logger.error("channel.video.publishVideo", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong while publishing video",
        });
      }
    }),
  deleteVideo: protectedApiChannelProcedure
    .input(
      z.object({
        video_id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }
      try {
        const video = await prisma.video.update({
          where: {
            id: input.video_id,
            channel_id: ctx.channel.id,
          },
          data: {
            is_deleted: true,
            delete_reason: `User deleted on (${new Date().toISOString()})`,
          },
        });
        return "Video deleted successfully";
      } catch (error) {}
    }),
});
