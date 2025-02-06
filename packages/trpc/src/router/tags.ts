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

const userZodObject = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().optional(),
  email: z.string(),
  role: z.enum(["ADMIN", "USER"]),
  channel_id: z.string().optional(),
});

export const tagsRouter = router({
  searchTags: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/tags/search",
        summary: "Search tags by name",
      },
    })
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .output(z.array(z.object({ id: z.string(), name: z.string() })))
    .query(async ({ input }) => {
      const tags = await prisma.videoTags.findMany({
        where: {
          tag: {
            contains: input.name,
          },
        },
      });

      return tags.map(tag => ({ id: tag.id, name: tag.tag }));
    }),
  getTagVideos: publicProcedure
    .input(
      z.object({
        name: z.string(),
        page: z.number().default(1),
      }),
    )
    .output(
      z.object({
        data: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            published_at: z.date(),
            view_count: z.number(),
            thumbnail: z.string(),
            channel: z.object({
              id: z.string(),
              name: z.string(),
              slug: z.string(),
              image: z.string(),
            }),
          }).nullable(),
        ),
        pagination: z.object({
          total_records: z.number(),
          current_page: z.number(),
          total_pages: z.number(),
          next_page: z.number().nullable(),
          prev_page: z.number().nullable(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const videos = await prisma.videoTags.findUnique({
          where: {
            tag: input.name,
          },
          select: {
            Video: {
              select: {
                id: true,
                title: true,
                description: true,
                thumbnail_s3_path: true,
                channel_id: true,
                channel: {
                  select: {
                    name: true,
                    slug: true,
                    image: true,
                  },
                },
                published_at: true,
                view_count: true,
                VideoTags: {
                  select:{
                    tag: true
                  }
                }
              },
              take: 10,
              skip: (input.page - 1) * 10,
            },
            _count: {
              select: {
                Video: true,
              },
            },
          },
        });
        if (!videos) {
          return {
            data: [],
            pagination: {
              total_records: 0,
              current_page: 1,
              total_pages: 0,
              next_page: null,
              prev_page: null,
            },
          };
        }
        const totalVideos = videos._count.Video ?? 0
        const total_pages = Math.ceil(totalVideos / 10);
        return {
          data: videos?.Video.map(video => ({
            id: video.id,
            title: video.title,
            description: video.description,
            published_at : video.published_at,
            view_count: Number(video.view_count),
            thumbnail: `${env.S3_PUBLIC_ENDPOINT}/${video.thumbnail_s3_path}`,
            channel: {
              id: video.channel_id,
              name: video.channel.name,
              slug: video.channel.slug,
              image: `${env.S3_PUBLIC_ENDPOINT}/${video.channel.image}`,
            },
            tags: video.VideoTags.map(tag => tag.tag)
          })),
          pagination: {
            current_page: input.page,
            total_pages: total_pages,
            total_records: totalVideos,
            next_page: input.page < total_pages ? input.page + 1 : null,
            prev_page: input.page > 1 ? input.page - 1 : null,
          },
        };
      } catch (error) {
        logger.error("tagsRouter.addTag", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add tag",
        });
      }
    }),
});
