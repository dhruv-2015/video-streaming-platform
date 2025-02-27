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

export const playlistRouter = router({
  createPlaylist: protectedApiProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/playlist",
        protect: true,
        tags: ["Playlist"],
        summary: "Create a new playlist",
      },
    })
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        is_private: z.boolean().default(true),
      }),
    )
    .output(z.object({ id: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await prisma.user.findUnique({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not found",
          });
        }
        const playlist = await prisma.playlist.create({
          data: {
            name: input.name,
            creater: {
              connect: {
                id: user.id,
              },
            },
            is_private: input.is_private,
            description: input.description,
          },
        });
        return {
          id: playlist.id,
          name: playlist.name,
        };
      } catch (error) {
        logger.error("playlist.createPlaylist", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong",
        });
      }
    }),
  getMyPlaylists: protectedApiProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/playlists",
        protect: true,
        summary: "Get all playlists of the current user",
        tags: ["Playlist"],
      },
    })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          type: z.enum(["private", "public"]),
          created_at: z.date(),
          video_count: z.number(),
          thumbnail: z.string(),
        }),
      ),
    )
    .query(async ({ ctx }) => {
      const user = prisma.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }
      const playlists = await prisma.playlist.findMany({
        where: {
          creater_id: ctx.session.user.id,
        },
        select: {
          _count: {
            select: {
              PlaylistVideo: true,
            },
          },
          PlaylistVideo: {
            take: 1,
            select: {
              video: {
                select: {
                  thumbnail: true,
                },
              },
            },
          },
          id: true,
          name: true,
          createdAt: true,
          is_private: true,
        },
      });

      return playlists.map(playlist => {
        const key = playlist.PlaylistVideo[0]?.video.thumbnail?.key;

        return {
          id: playlist.id,
          name: playlist.name,
          created_at: playlist.createdAt,
          type: playlist.is_private ? "private" : "public",

          video_count: playlist._count.PlaylistVideo,
          thumbnail: key
            ? env.S3_PUBLIC_VIDEO_ENDPOINT + "/" + key
            : env.S3_PUBLIC_VIDEO_ENDPOINT + "/thumbnail/default.svg",
        };
      });
    }),
  getPlaylist: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/playlist/{id}",
        summary: "Get playlist by id",
        description:
          "Get playlist by id. for private playlist you need to be the owner of the playlist and logged in",
        tags: ["Playlist"],
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
        name: z.string(),
        type: z.enum(["private", "public"]),
        created_at: z.date(),
        description: z.string(),
        video_count: z.number(),
        thumbnail: z.string(),
        creater_id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const playlist = await prisma.playlist.findUnique({
        where: {
          id: input.id,
        },
        include: {
          _count: {
            select: {
              PlaylistVideo: true,
            },
          },
          PlaylistVideo: {
            take: 1,
            select: {
              video: {
                select: {
                  thumbnail: true,
                },
              },
            },
          },
        },
      });
      if (!playlist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Playlist not found",
        });
      }
      if (playlist.is_private) {
        if (!ctx.session?.user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Playlist not found",
          });
        }
        const user = await prisma.user.findUnique({
          where: {
            id: ctx.session?.user.id,
          },
        });
        if (!(playlist.creater_id === user?.id || user?.role === "ADMIN")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Playlist not found",
          });
        }
      }
      const imageKey = playlist.PlaylistVideo[0]?.video.thumbnail?.key;
      return {
        id: playlist.id,
        name: playlist.name,
        // image: imageKey
        //   ? env.S3_PUBLIC_VIDEO_ENDPOINT + "/" + imageKey
        //   : env.S3_PUBLIC_VIDEO_ENDPOINT + "/thumbnail/default.svg",
        thumbnail: `${env.S3_PUBLIC_VIDEO_ENDPOINT}/${imageKey ?? "thumbnail/default.svg"}`,
        creater_id: playlist.creater_id,
        description: playlist.description,
        created_at: playlist.createdAt,
        type: playlist.is_private ? "private" : "public",
        video_count: playlist._count.PlaylistVideo,
      };
    }),

  getVideoPlaylist: protectedApiProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/video/{video_id}/playlists",
        summary: "Get all playlists of a video",
        description:
          "get all playlists of a particular video by video id. (only for the owner of the video)",
        tags: ["Playlist"],
        protect: true,
      },
    })
    .input(
      z.object({
        video_id: z.string(),
      }),
    )
    .output(z.array(z.string()))
    .query(async ({ ctx, input }) => {
      try {
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
        const playlist = await prisma.playlistVideo.findMany({
          where: {
            video_id: video.id,
          },
        });
        return playlist.map(p => p.playlist_id);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong",
        });
      }
    }),
  // todo getVideoPlaylist
  getPlaylistVideo: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/playlist/{playlist_id}/video",
        summary: "Get all videos of a playlist",
        tags: ["Playlist"],
      },
    })
    .input(
      z.object({
        playlist_id: z.string(),
        page: z.number().default(1),
        limit: z.number().default(10),
      }),
    )
    .output(
      z.object({
        total_videos: z.number(),
        total_pages: z.number(),
        next_page: z.number().nullable(),
        previous_page: z.number().nullable(),
        video: z.array(
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
            is_ready: z.boolean(),
            is_published: z.boolean(),
            created_at: z.date(),
          }),
        ),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const videos = await prisma.playlistVideo.findMany({
          where: {
            playlist_id: input.playlist_id,
            video: {
              is_published: true,
              is_ready: true,
              is_deleted: false,
              is_banned: false,
            },
          },
          include: {
            video: {
              select: {
                channel: {
                  select: {
                    name: true,
                    image: true,
                    id: true,
                    slug: true,
                  },
                },
                title: true,
                description: true,
                thumbnail: true,
                createdAt: true,
                id: true,
                view_count: true,
                VideoFile: {
                  select: {
                    duration: true,
                  },
                },
                is_ready: true,
                is_published: true,
              },
            },
          },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          orderBy: {
            index: "desc",
          },
        });
        const total_videos = await prisma.playlistVideo.count({
          where: {
            playlist_id: input.playlist_id,
            video: {
              is_published: true,
              is_ready: true,
              is_deleted: false,
              is_banned: false,
            },
          },
        });

        const total_pages = Math.ceil(total_videos / input.limit);

        return {
          total_videos,
          total_pages,
          next_page: input.page < total_pages ? input.page + 1 : null,
          previous_page: input.page > 1 ? input.page - 1 : null,
          video: videos.map(v => ({
            channel: {
              id: v.video.channel.id,
              image: v.video.channel.image
                ? env.S3_PUBLIC_VIDEO_ENDPOINT + "/" + v.video.channel.image.key
                : env.S3_PUBLIC_VIDEO_ENDPOINT + "/thumbnail/default.svg",
              name: v.video.channel.name,
              slug: v.video.channel.slug,
            },
            description: v.video.description,
            duration: v.video.VideoFile?.duration ?? 0,
            id: v.video.id,
            is_published: v.video.is_published,
            is_ready: v.video.is_ready,
            thumbnail: v.video.thumbnail
              ? env.S3_PUBLIC_VIDEO_ENDPOINT + "/" + v.video.thumbnail.key
              : env.S3_PUBLIC_VIDEO_ENDPOINT + "/thumbnail/default.svg",
            title: v.video.title,
            view_count: Number(v.video.view_count),
            created_at: v.video.createdAt,
          })),
        };
      } catch (error) {
        logger.error("playlist.getPlaylistVideo", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong",
        });
      }
    }),

  updatePlaylist: protectedApiProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/playlist/{id}",
        summary: "Update playlist",
        description: "Update playlist name",
        protect: true,
        tags: ["Playlist"],
      },
    })
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        visibility: z.enum(["private", "public"]).optional(),
      }),
    )
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      try {
        await prisma.playlist.update({
          data: {
            name: input.name,
            description: input.description ?? "",
            is_private:
              input.visibility === undefined
                ? undefined
                : input.visibility === "private"
                  ? true
                  : false,
          },
          where: {
            id: input.id,
            creater_id: ctx.session.user.id,
          },
        });
        return;
      } catch (error) {
        logger.error("playlist.updatePlaylist", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong",
        });
      }
    }),

  // todo changeVideoIndex
  changeVideoIndex: protectedApiProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/playlist/{playlist_id}/video/{video_id}/index",
      },
    })
    .input(
      z.object({
        playlist_id: z.string(),
        video_id: z.string(),
        index: z.number(),
      }),
    )
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      // todo
      try {
        const playlist = await prisma.playlist.findUnique({
          where: {
            id: input.playlist_id,
          },
        });
        if (!playlist) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Playlist not found",
          });
        }
        if (playlist.creater_id !== ctx.session.user.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You are not the owner of the playlist",
          });
        }
        const playlistVideo = await prisma.playlistVideo.findUnique({
          where: {
            playlist_id_video_id: {
              playlist_id: input.playlist_id,
              video_id: input.video_id,
            },
          },
        });
        if (!playlistVideo) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video not found in the playlist",
          });
        }
        const count = await prisma.playlistVideo.count({
          where: {
            playlist_id: input.playlist_id,
          },
        });
        prisma.$transaction(async p => {
          const increment = input.index > playlistVideo.index ? false : true;
          if (increment) {
            p.playlistVideo.updateMany({
              data: {
                index: {
                  increment: 1,
                },
              },
              where: {
                playlist_id: input.playlist_id,
                index: {
                  gte: input.index,
                  lte: playlistVideo.index,
                },
              },
            });
          } else {
            p.playlistVideo.updateMany({
              data: {
                index: {
                  decrement: 1,
                },
              },
              where: {
                playlist_id: input.playlist_id,
                index: {
                  gte: input.index,
                  lte: playlistVideo.index,
                },
              },
            });
          }
          // await p.playlistVideo.updateMany({
          //   data: {
          //     index: {
          //       increment: 1,
          //     },
          //   },
          //   where: {
          //     playlist_id: input.playlist_id,
          //     index: {
          //       gte: input.index,
          //     },
          //   },
          await p.playlistVideo.update({
            data: {
              index: {},
            },
            where: {
              id: playlistVideo.id,
            },
          });
        });
        await prisma.playlistVideo.update({
          data: {
            index: input.index,
          },
          where: {
            id: playlistVideo.id,
          },
        });
        return;
      } catch (error) {
        logger.error("playlist.changeVideoIndex", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong",
        });
      }
    }),

  deletePlaylist: protectedApiProcedure
    .input(z.object({ id: z.string() }))
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      try {
        await prisma.playlist.delete({
          where: {
            id: input.id,
            creater_id: ctx.session.user.id,
          },
        });
        return;
      } catch (error) {
        logger.error("playlist.deletePlaylist", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong",
        });
      }
    }),

  addOrRemoveVideoToPlaylist: protectedApiProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/playlist/{playlist_id}/video",
        summary: "Add or remove video to playlist",
        description:
          "Add or remove video to playlist. If add is true, video will be added to the playlist, if add is false, video will be removed from the playlist",
        protect: true,
        tags: ["Playlist"],
      },
    })
    .input(
      z.object({
        video_id: z.string(),
        playlist_id: z.string(),
        add: z.boolean(),
      }),
    )
    .output(z.boolean())
    .mutation(async ({ ctx, input }) => {
      try {
        const playlist = await prisma.playlist.findUnique({
          where: {
            id: input.playlist_id,
          },
        });
        if (!playlist) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Playlist not found",
          });
        }
        if (playlist.creater_id !== ctx.session.user.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You are not the owner of the playlist",
          });
        }
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
        const playlistVideo = await prisma.playlistVideo.findFirst({
          where: {
            playlist_id: input.playlist_id,
            video_id: input.video_id,
          },
        });
        if (input.add && playlistVideo) {
          return true;
        }
        if (!input.add && !playlistVideo) {
          return false;
        }

        if (input.add && !playlistVideo) {
          const index = await prisma.playlistVideo.count({
            where: {
              video_id: input.video_id,
            },
          });
          await prisma.playlistVideo.create({
            data: {
              playlist_id: input.playlist_id,
              video_id: input.video_id,
              index: index,
            },
          });
          return true;
        } else if (!input.add && playlistVideo) {
          await prisma.playlistVideo.delete({
            where: {
              id: playlistVideo.id,
            },
          });
          return false;
        }

        return false;
      } catch (error) {
        logger.error("playlist.addOrRemoveVideoToPlaylist", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong",
        });
      }
    }),
  // video: videoRouter
  // t.middleware(async ({ next, path }) => {})
});
