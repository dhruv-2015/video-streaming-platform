import logger from "../../logger";
import {
  protectedApiChannelProcedure,
  protectedApiProcedure,
  router,
} from "../../trpc";
import { TRPCError } from "@trpc/server";
import { customS3Uploader } from "@workspace/aws";
import { prisma } from "@workspace/database";
import { env } from "@workspace/env";
import { z } from "zod";
import path from "path";
// import { tagsRouter } from "./tags";

export const channelRouter = router({
  checkChannelSlug: protectedApiProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/channel/check-slug",
        summary: "Check Channel Slug availability",
        protect: true,
        tags: ["Channel"],
      },
    })
    .input(z.object({ slug: z.string() }))
    .output(
      z.object({
        available: z.boolean(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const channel = await prisma.channel.findUnique({
          where: {
            slug: input.slug,
          },
        });
        console.log(channel, "channel", channel === null, channel !== null);

        return {
          available: channel === null,
        };
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
      const channel = await prisma.$transaction(async prisma => {
        const channel = await prisma.channel.create({
          data: {
            name: input.name,
            slug: input.slug,
            User: {
              connect: {
                id: ctx.session.user.id,
              },
            },
            description: input.description,
          },
        });
        await prisma.user.update({
          data: {
            channel_id: channel.id,
          },
          where: {
            id: ctx.session.user.id,
          },
        });
        return channel;
      });
      return {
        id: channel.id,
        name: channel.name,
        slug: channel.slug,
      };
    }),
  deleteChannel: protectedApiChannelProcedure
    .input(z.object({}))
    .output(z.string().optional())
    .mutation(async ({ ctx }) => {
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
  updateChannel: protectedApiChannelProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/channel",
        summary: "Update Channel information",
        protect: true,
        tags: ["Channel"],
      },
    })
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
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
      if (!ctx.channel) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Channel not found",
        });
      }
      const channel = await prisma.channel.update({
        where: {
          id: ctx.channel.id,
        },
        data: {
          name: input.name,
          description: input.description,
        },
      });
      return {
        id: channel.id,
        name: channel.name,
        slug: channel.slug,
      };
    }),

  getMychannel: protectedApiChannelProcedure
    .input(z.void())
    .output(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        // subscriber_count: z.number(),
        // total_views: z.number(),
        image: z.string().optional(),
        stats: z.object({
          totalViews: z.number(),
          totalSubscribers: z.number(),
          totalVideos: z.number(),
        }),
      }),
    )
    .query(async ({ ctx }) => {
      if (!ctx.channel) {
        await prisma.user.update({
          data: {
            channel_id: null,
          },
          where: {
            id: ctx.session.user.id,
          },
        });
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }
      const totalVideos = await prisma.video.count({
        where: {
          channel_id: ctx.channel.id,
        },
      });
      return {
        id: ctx.channel.id,
        name: ctx.channel.name,
        slug: ctx.channel.slug,
        description: ctx.channel.description,
        // subscriber_count: ctx.channel.subscriber_count,
        // total_views: ctx.channel.total_views,
        image: ctx.channel.image
          ? `${env.S3_PUBLIC_ENDPOINT}/${ctx.channel.image.key}`
          : `${env.S3_PUBLIC_VIDEO_ENDPOINT}/thumbnail/default.svg`,
        stats: {
          totalSubscribers: ctx.channel.subscriber_count,
          totalViews: ctx.channel.total_views,
          totalVideos: totalVideos,
        },
      };
    }),
  generatePresignedUrlForChannelImage: protectedApiChannelProcedure
    .input(
      z.object({
        name: z.string(),
        size: z.number(),
      }),
    )
    .output(z.object({ url: z.string(), file_id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.channel) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Channel not found",
        });
      }
      try {
        const presignedUrl = await customS3Uploader.generatePresignedUrl({
          bucket: env.S3_FILES_BUCKET,
          for: "temp",
          maxSizeBytes: input.size,
          fileName: input.name,
        });
        const file = await prisma.tempFileUpload.create({
          data: {
            bucket: presignedUrl.s3Data.bucket,
            expires: presignedUrl.s3Data.expire,
            key: presignedUrl.s3Data.key,
          },
        });
        return {
          url: presignedUrl.url,
          file_id: file.id,
        };
      } catch (error) {
        logger.error("studio.channel.generatePresignedUrlForChannelImage", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate presigned url",
        });
      }
    }),
  uploadChannelImage: protectedApiChannelProcedure
    .input(z.object({ file_id: z.string() }))
    .output(z.object({
      image: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.channel) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Channel not found",
        });
      }
      try {
        const file = await prisma.tempFileUpload.findUnique({
          where: {
            id: input.file_id,
          }
        })
        if (!file) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File not found",
          })
        }
        const fileExists = await customS3Uploader.checkFileExists({
          bucket: file.bucket,
          key: file.key,
        })
        if (!fileExists) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File not found",
          })
        }
        await customS3Uploader.copyObject({
          bucket: file.bucket,
          key: file.key,
        }, {
          bucket: env.S3_FILES_BUCKET,
          key: `channel/thumbnail/${ctx.channel?.id}${path.extname(file.key)}`,
        })
        await prisma.channel.update({
          data: {
            image: {
              bucket: env.S3_FILES_BUCKET,
              key: `channel/thumbnail/${ctx.channel?.id}${path.extname(file.key)}`,
            }
          },
          where: {
            id: ctx.channel.id
          }
        });
        return {
          image: `${env.S3_PUBLIC_ENDPOINT}/channel/thumbnail/${ctx.channel.id}${path.extname(file.key)}`
        };
      } catch (error) {
        logger.error("studio.channel.uploadChannelImage", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload channel image",
        });
      }
    })
});
