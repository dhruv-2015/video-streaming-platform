import { z } from "zod";

// import { prisma } from "@workspace/database";

import {
  protectedApiProcedure,
  publicProcedure,
  router,
  protectedApiChannelProcedure,
  t,
} from "../../trpc";
import { prisma, redis } from "@workspace/database";
import { TRPCError } from "@trpc/server";
import { customS3Uploader } from "@workspace/aws";
import logger from "../../logger";
import { env } from "@workspace/env";
import { recomandationSystem } from "@workspace/services";
import { transcodeVideo } from "@/bullmq/videoTranscoderQueue";

export const videoRouter = router({
  
  // getVideo: protectedApiChannelProcedure
  //   .meta({
  //     openapi: {
  //       method: "GET",
  //       path: "/channel/video/{id}",
  //       summary: "Get video by id for creaters only",
  //       protect: true,
  //       tags: ["Channel", "video"],
  //     },
  //   })
  //   .input(
  //     z.object({
  //       id: z.string(),
  //     }),
  //   )
  //   .output(
  //     z.object({
  //       id: z.string(),
  //       title: z.string(),
  //       video_type: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]),
  //       view_count: z.number(),
  //       description: z.string(),
  //       thumbnail_s3_path: z.string().optional(),
  //       avalable_thumbnail_s3_path: z.array(z.string()),
  //       dislike_count: z.number(),
  //       like_count: z.number(),
  //       is_banned: z.boolean(),
  //       error_message: z.string().optional(),
  //       banned_reason: z.string().optional(),
  //       is_deleted: z.boolean(),
  //       deleted_reason: z.string().optional(),
  //       is_published: z.boolean(),
  //       is_ready: z.boolean(),
  //       channel_id: z.string(),
  //       is_uploaded: z.boolean(),
  //       m3u8_url_s3_path: z.string().optional(),
  //       duration: z.number().optional(),
  //       audio_channels: z.number().optional(),
  //       tags: z.array(z.string()),
  //     }),
  //   )
  //   .query(async ({ ctx, input }) => {
  //     if (!ctx.channel) {
  //       throw new TRPCError({
  //         code: "NOT_FOUND",
  //         message: "Channel not found",
  //       });
  //     }
  //     try {
  //       const video = await prisma.video.findUnique({
  //         where: {
  //           id: input.id,
  //           channel_id: ctx.channel.id,
  //           is_published: true,
  //         },
  //         include: {
  //           VideoFile: true,
  //           VideoTags: {
  //             select: {
  //               tag: true,
  //             },
  //           },
  //         },
  //       });
  //       if (!video) {
  //         throw new TRPCError({
  //           code: "NOT_FOUND",
  //           message: "Video not found",
  //         });
  //       }
  //       return {
  //         id: video.id,
  //         title: video.title,
  //         avalable_thumbnail_s3_path: video.avalable_thumbnail_s3_path.map(
  //           v => v.key,
  //         ),
  //         error_message: video.error_message ?? undefined,
  //         channel_id: video.channel_id,
  //         description: video.description,
  //         dislike_count: Number(video.dislike_count),
  //         is_banned: video.is_banned,
  //         deleted_reason: video.delete_reason ?? undefined,
  //         banned_reason: video.banned_reason ?? undefined,
  //         is_deleted: video.is_deleted,
  //         is_published: video.is_published,
  //         is_ready: video.is_ready,
  //         like_count: Number(video.like_count),
  //         is_uploaded: video.is_uploaded,
  //         video_type: video.video_type as "PUBLIC" | "PRIVATE" | "UNLISTED",
  //         view_count: Number(video.view_count),
  //         thumbnail_s3_path: video.thumbnail_s3_path ? env.S3_PUBLIC_ENDPOINT + "/" + video.thumbnail_s3_path.bucket + "/" + video.thumbnail_s3_path.key : undefined,
  //         m3u8_url_s3_path: video.VideoFile ? env.S3_PUBLIC_ENDPOINT + "/" + video.VideoFile.m3u8.bucket + "/" + video.VideoFile.m3u8.key : undefined,
  //         duration: video.VideoFile?.duration ?? undefined,
  //         audio_channels: video.VideoFile?.audio_channels ?? undefined,
  //         tags: video.VideoTags.map(v => v.tag),
  //       };
  //     } catch (error) {
  //       logger.error("channel.video.getVideo", error);
  //       throw new TRPCError({
  //         code: "INTERNAL_SERVER_ERROR",
  //         message: `something went wrong while fetching video`,
  //       });
  //     }
  //   }),

  
  // transcodeVideo: protectedApiChannelProcedure.subscription(async ({ctx}) => {
  //   if (!ctx.channel) {
  //     throw new TRPCError({
  //       code: "NOT_FOUND",
  //       message: "Channel not found",
  //     });
  //   }
  //   redis
  // })
});
