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


export const likeRouter = router({
  getMyLikesVideo: protectedApiProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
      }),
    )
    .output(z.object({
        total_page: z.number(),
        total_videos: z.number(),
        next_page: z.number().nullable(),
        previos_page: z.number().nullable(),
        videos: z.array(z.object({
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
        })),
    }))
    .query(async ({ctx, input}) => {
        try {
            const likeVideos = await prisma.videoLike.findMany({
                where: {
                    user_id: ctx.session.user.id,
                    Video: {
                        is_banned: false,
                        is_deleted: false,
                        is_published: true,
                        is_ready: true,
                    }
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
                                }
                            },
                            view_count: true,
                            createdAt: true,
                            channel: {
                                select: {
                                    id: true,
                                    name: true,
                                    image: true,
                                }
                            }
                        }
                    }
                },
                skip: (input.page - 1) * input.limit,
                take: input.limit,
            })
            const totalLikeVideos = await prisma.videoLike.count({
                where: {
                    user_id: ctx.session.user.id,
                    Video: {
                        is_banned: false,
                        is_deleted: false,
                        is_published: true,
                        is_ready: true,
                    }
                }
            });
            const total_pages = Math.ceil(totalLikeVideos / input.limit);
            return {
                total_page: total_pages,
                total_videos: totalLikeVideos,
                next_page: total_pages > input.page ? input.page + 1 : null,
                previos_page: input.page > 1 ? input.page - 1 : null,
                videos: likeVideos.map((like) => {
                    return {
                        id: like.Video.id,
                        title: like.Video.title,
                        description: like.Video.description,
                        thumbnail: like.Video.thumbnail?.key ? env.S3_PUBLIC_VIDEO_ENDPOINT + "/" + like.Video.thumbnail.key : env.S3_PUBLIC_VIDEO_ENDPOINT + "/thumbnail/default.svg",
                        duration: like.Video.VideoFile?.duration ?? 0,
                        view_count: Number(like.Video.view_count),
                        created_at: like.Video.createdAt,
                        channel: {
                            id: like.Video.channel.id,
                            name: like.Video.channel.name,
                            image: like.Video.channel.image?.key ? env.S3_PUBLIC_VIDEO_ENDPOINT + "/" + like.Video.channel.image.key : env.S3_PUBLIC_VIDEO_ENDPOINT + "/thumbnail/default.svg",
                        },
                    }
                })

            }
        } catch (error) {
            logger.error("getMyLikesVideo", error);
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to get liked videos",
            })
        }
    }),
});
