import { literal, z } from "zod";
import {
  protectedApiProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "../trpc";
import { Prisma, prisma } from "@workspace/database";
import { TRPCError } from "@trpc/server";
import logger from "../logger";
import { env } from "@workspace/env";
import { recomandationSystem } from "@workspace/services";
// import { tagsRouter } from "./tags";

export const videoRouter = router({
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
    .meta({
      openapi: {
        method: "GET",
        path: "/video/{video_id}",
        summary: "Get video by id",
        description: "Get video by id",
        tags: ["video"],
      },
    })
    .input(
      z.object({
        video_id: z.string(),
      }),
    )
    .output(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        thumbnail: z.string(),
        like_count: z.number(),
        disslike_count: z.number(),
        is_like: z.boolean(),
        is_disslike: z.boolean(),
        upload_at: z.date(),
        view_count: z.number(),
        duration: z.number({
          description: "Duration in seconds",
        }),
        channel: z.object({
          id: z.string(),
          name: z.string(),
          image: z.string(),
          subscriber_count: z.number(),
          slug: z.string(),
        }),
        tags: z.array(z.string()),
        stream: z.object({
          m3u8: z.string(),
          storyboard: z.string(),
          audio_channels: z.number(),
          subtitle_channels: z.number(),
          subtitles: z.array(
            z.object({
              src: z.string(),
              default: z.boolean(),
              type: z.string(),
              label: z.string(),
              language: z.string(),
            }),
          ),
        }),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const video = await prisma.video.findUnique({
          where: {
            id: input.video_id,
            is_ready: true,
            is_deleted: false,
            is_banned: false,
            is_published: true,
          },
          include: {
            channel: {
              select: {
                name: true,
                id: true,
                image: true,
                slug: true,
                subscriber_count: true,
              },
            },
            VideoFile: {
              select: {
                audio_channels: true,
                subtitle_channels: true,
                duration: true,
                id: true,
                m3u8: true,
                subtitle: true,
                storyboard: true,
              },
            },
            VideoTags: {
              select: {
                tag: true,
              },
            },
            VideoLike: {
              where: {
                user_id: ctx.session?.user.id,
              },
            },
            VideoDissLike: {
              where: {
                user_id: ctx.session?.user.id,
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
        if (!video.VideoFile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video file not found",
          });
        }
        return {
          id: video.id,
          title: video.title,
          description: video.description,
          upload_at: video.published_at ?? video.createdAt,
          thumbnail: video.thumbnail
            ? `${env.S3_PUBLIC_VIDEO_ENDPOINT}/${video.thumbnail.key}`
            : env.S3_PUBLIC_VIDEO_ENDPOINT + "/thumbnail/default.svg",
          like_count: Number(video.like_count),
          disslike_count: Number(video.dislike_count),
          view_count: Number(video.view_count),
          duration: video.VideoFile.duration,
          channel: {
            id: video.channel.id,
            name: video.channel.name,
            subscriber_count: video.channel.subscriber_count,
            slug: video.channel.slug,
            image: video.channel.image
              ? `${env.S3_PUBLIC_ENDPOINT}/${video.channel.image.key}`
              : env.S3_PUBLIC_VIDEO_ENDPOINT + "/thumbnail/default.svg",
          },
          tags: video.VideoTags.map(tag => tag.tag),
          is_like: video.VideoLike.length > 0,
          is_disslike: video.VideoDissLike.length > 0,
          stream: {
            m3u8: video.VideoFile.m3u8
              ? `${env.S3_PUBLIC_VIDEO_ENDPOINT}/${video.VideoFile.m3u8.key}`
              : "",
            storyboard: video.VideoFile.storyboard
              ? `${env.S3_PUBLIC_VIDEO_ENDPOINT}/${video.VideoFile.storyboard.vtt.key}`
              : "",
            subtitles: video.VideoFile.subtitle
              ? video.VideoFile.subtitle.map(sub => {
                  return {
                    src: `${env.S3_PUBLIC_VIDEO_ENDPOINT}/${sub.url.key}`,
                    default: sub.default,
                    type: sub.type,
                    label: sub.label,
                    language: sub.language,
                  };
                })
              : [],
            audio_channels: video.VideoFile.audio_channels,
            subtitle_channels: video.VideoFile.subtitle_channels,
          },
        };
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

  getVideoRecommendations: publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/video/{video_id}/recommendations",
      summary: "Get video recommendations",

      tags: ["video"],
    }
  })
    .input(
      z.object({
        video_id: z.string(),
      }),
    )
    .output(
      z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
          thumbnail: z.string(),
          view_count: z.number(),
          duration: z.number(),
          channel: z.object({
            name: z.string(),
            image: z.string(),
            id: z.string(),
            slug: z.string(),
          }),

          created_at: z.date(),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      const limit = 10;
      try {
        const video = await prisma.video.findUnique({
          where: {
            id: input.video_id,
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

        const response = await recomandationSystem.getRecomandations(
          `${video.title} ${video.description} ${video.VideoTags.map(tag => tag.tag).join(" ")}`,
          limit * 3,
        );

        console.log(response);
        
        const videos = await prisma.video.findMany({
          where: {
            id: {
              in: response,
              notIn: [video.id],
            },
            is_banned: false,
            is_deleted: false,
            is_published: true,
            is_ready: true,
          },
          include: {
            channel: {
              select: {
                id: true,
                name: true,
                image: true,
                slug: true,
              },
            },
            VideoFile: {
              select: {
                duration: true,
              },
            },
          },
          take: limit,
          // orderBy: {
          //   view_count: "desc"

          // }
        });
        return videos.map(video => ({
          channel: {
            id: video.channel.id,
            image: video.channel.image
              ? `${env.S3_PUBLIC_ENDPOINT}/${video.channel.image.key}`
              : env.S3_PUBLIC_VIDEO_ENDPOINT + "/thumbnail/default.svg",
            name: video.channel.name,
            slug: video.channel.slug,
          },
          created_at: video.createdAt,
          description: video.description,
          duration: video.VideoFile?.duration ?? 0,
          id: video.id,
          thumbnail: video.thumbnail
            ? `${env.S3_PUBLIC_VIDEO_ENDPOINT}/${video.thumbnail.key}`
            : env.S3_PUBLIC_VIDEO_ENDPOINT + "/thumbnail/default.svg",
          title: video.title,
          view_count: Number(video.view_count),
        }));
      } catch (error) {
        logger.error("video.getVideoRecommendations", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),

  toggleLikeVideo: protectedApiProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/video/{video_id}/like",
        summary: "Like video",
        description: "toggle like in video",
        protect: true,
        tags: ["video"],
      },
    })
    .input(
      z.object({
        video_id: z.string(),
      }),
    )
    .output(
      z.object({
        like: z.boolean(),
        count: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const video = await prisma.video.findUnique({
        where: {
          id: input.video_id,
          is_deleted: false,
          is_banned: false,
          is_ready: true,
          is_published: true,
        },
      });
      if (!video) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video not found",
        });
      }
      const videoLike = await prisma.videoLike.findUnique({
        where: {
          video_id_user_id: {
            video_id: input.video_id,
            user_id: ctx.session.user.id,
          },
        },
      });

      return await prisma.$transaction(async p => {
        let add = 0;
        let count = 0;
        if (!videoLike) {
          await p.videoLike.create({
            data: {
              user_id: ctx.session.user.id,
              video_id: video.id,
            },
          });
          add += 1;
          const vid = await p.video.update({
            data: {
              like_count: {
                increment: 1,
              },
            },
            where: {
              id: video.id,
            },
            select: {
              id: true,
              like_count: true,
            },
          });
          count = Number(vid.like_count);
        } else {
          await p.videoLike.delete({
            where: {
              id: videoLike.id,
            },
          });
          add -= 1;
          const vid = await p.video.update({
            data: {
              like_count: {
                decrement: 1,
              },
            },
            where: {
              id: input.video_id,
            },
            select: {
              id: true,
              like_count: true,
            },
          });
          count = Number(vid.like_count);
        }

        return {
          like: add > 0,
          count: count,
        };
      });
    }),
  toggleDissLikeVideo: protectedApiProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/video/{video_id}/disslike",
        summary: "Disslike video",
        description: "toggle disslike in video",
        protect: true,
        tags: ["video"],
      },
    })
    .input(
      z.object({
        video_id: z.string(),
      }),
    )
    .output(
      z.object({
        disslike: z.boolean(),
        count: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const video = await prisma.video.findUnique({
        where: {
          id: input.video_id,
        },
      });
      if (!video) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video not found",
        });
      }
      const videoDissLike = await prisma.videoDissLike.findUnique({
        where: {
          video_id_user_id: {
            video_id: input.video_id,
            user_id: ctx.session.user.id,
          },
        },
      });

      return await prisma.$transaction(async p => {
        let add = 0;
        let count = 0;
        if (!videoDissLike) {
          await p.videoDissLike.create({
            data: {
              user_id: ctx.session.user.id,
              video_id: input.video_id,
            },
          });
          add += 1;
          const vid = await p.video.update({
            data: {
              dislike_count: {
                increment: add,
              },
            },
            where: {
              id: input.video_id,
            },
            select: {
              id: true,
              dislike_count: true,
            },
          });
          count = Number(vid.dislike_count);
        } else {
          await p.videoDissLike.delete({
            where: {
              id: videoDissLike.id,
            },
          });
          add -= 1;
          const vid = await p.video.update({
            data: {
              dislike_count: {
                decrement: add,
              },
            },
            where: {
              id: input.video_id,
            },
            select: {
              id: true,
              dislike_count: true,
            },
          });
          count = Number(vid.dislike_count);
        }

        return {
          disslike: add > 0,
          count: count,
        };
      });
    }),


  getVideoState: protectedApiProcedure
    .input(
      z.object({
        video_id: z.string(),
      }),
    )
    .output(
      z.object({
        isLiked: z.boolean(),
        isDissLiked: z.boolean(),
        video_progress: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const video = await prisma.video.findUnique({
        where: {
          id: input.video_id,
          is_banned: false,
          is_deleted: false,
          is_ready: true,
        },
      });
      if (!video) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video not found",
        });
      }
      const isLiked = await prisma.videoLike.findUnique({
        where: {
          video_id_user_id: {
            video_id: input.video_id,
            user_id: ctx.session.user.id,
          },
        },
      });
      const isDissLiked = await prisma.videoDissLike.findUnique({
        where: {
          video_id_user_id: {
            video_id: input.video_id,
            user_id: ctx.session.user.id,
          },
        },
      });
      return {
        isDissLiked: !!isDissLiked,
        isLiked: !!isLiked,
        video_progress: 0,
      };
    }),

  getVideos: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/videos",
        summary: "Get videos",
        description: "Get videos",
        tags: ["video"],
      },
    })
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        sort: z.enum(["RELEVANT", "NEWEST", "OLDEST"]).default("RELEVANT"),
        tags: z
          .string({
            message: "Tags separated by comma (,)",
          })
          .optional(),
        search: z.string().optional(),
      }),
    )
    .output(
      z.object({
        total_videos: z.number(),
        total_pages: z.number(),
        next_page: z.number().nullable(),
        previos_page: z.number().nullable(),
        videos: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            thumbnail: z.string(),
            view_count: z.number(),
            created_at: z.date(),
            channel: z.object({
              id: z.string(),
              name: z.string(),
              image: z.string(),
              subscriber_count: z.number(),
              slug: z.string(),
            }),
          }),
        ),
      }),
    )
    .query(async ({ ctx, input }) => {
      const search = input.search ?? "";
      const tags = input.tags ? input.tags.replace(/ /g, "").split(",") : [];
      const take = input.limit;
      const skip = (input.page - 1) * input.limit;
      const sort = input.sort;

      const where: Prisma.VideoWhereInput = {
        is_ready: true,
        is_deleted: false,
        is_banned: false,
        is_published: true,
      };
      if (search != "") {
        where.title = {
          // in: search.split(" "),
          contains: search,
        };
      }
      if (tags.length > 0) {
        where.VideoTags = {
          some: {
            tag: {
              in: tags,
            },
          },
        };
      }

      const videos = await prisma.video.findMany({
        skip,
        take,
        where,
        orderBy: {
          createdAt: sort === "NEWEST" ? "desc" : "asc",
        },
        select: {
          id: true,
          title: true,
          thumbnail: true,
          view_count: true,
          createdAt: true,
          channel: {
            select: {
              id: true,
              name: true,
              image: true,
              subscriber_count: true,
              slug: true,
            },
          },
        },
      });

      const total_videos = await prisma.video.count({ where });

      const total_pages = Math.ceil(total_videos / input.limit);

      return {
        next_page: total_pages > input.page ? input.page + 1 : null,
        previos_page: input.page > 1 ? input.page - 1 : null,
        total_pages,
        total_videos,
        videos: videos.map(video => ({
          id: video.id,
          title: video.title,
          channel: {
            id: video.channel.id,
            name: video.channel.name,
            image: video.channel.image
              ? `${env.S3_PUBLIC_ENDPOINT}/${video.channel.image.key}`
              : env.S3_PUBLIC_VIDEO_ENDPOINT + "/thumbnail/default.svg",
            subscriber_count: Number(video.channel.subscriber_count),
            slug: video.channel.slug,
          },
          // published_at: video.published_at!,
          created_at: video.createdAt,
          thumbnail: video.thumbnail
            ? `${env.S3_PUBLIC_VIDEO_ENDPOINT}/${video.thumbnail.key}`
            : env.S3_PUBLIC_VIDEO_ENDPOINT + "/thumbnail/default.svg",
          view_count: Number(video.view_count),
        })),
      };
    }),

  // tags: tagsRouter
});
