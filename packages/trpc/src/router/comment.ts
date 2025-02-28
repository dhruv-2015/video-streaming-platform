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

export const commentsRouter = router({
  getCommentsForVideo: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/video/{video_id}/comments",
        summary: "Get comments for a video",
        description: "use auth token to get isLiked and isDisliked",
        tags: ["comment", "Video"],
      },
    })
    .input(
      z.object({
        video_id: z.string(),
        page: z.number().default(1),
        limit: z.number().default(10),
        comment_id: z.string().optional(),
      }),
    )
    .output(
      z.object({
        total_page: z.number(),
        total_comments: z.number(),
        next_page: z.number().nullable(),
        previos_page: z.number().nullable(),
        comments: z.array(
          z.object({
            id: z.string(),
            content: z.string(),
            createdAt: z.date(),
            isUpdated: z.boolean(),
            like_count: z.number(),
            dislike_count: z.number(),
            idLiked: z.boolean(),
            isDissLiked: z.boolean(),
            user: z.object({
              id: z.string(),
              name: z.string(),
              avatar: z.string(),
            }),
            reply_count: z.number(),
          }),
        ),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        if (input.comment_id) {
          const replies = await prisma.videoCommentReply.findMany({
            where: {
              comment_id: input.comment_id,
              is_deleted: false,
            },
            include: {
              _count: {
                select: {
                  VideoCommentDissLike: true,
                  VideoCommentLike: true,
                },
              },
              VideoCommentDissLike: {
                where: {
                  user_id: ctx.session?.user.id,
                },
                select: {
                  id: true,
                },
              },
              VideoCommentLike: {
                where: {
                  user_id: ctx.session?.user.id,
                },
                select: {
                  id: true,
                },
              },
              User: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            take: input.limit,
            skip: (input.page - 1) * input.limit,
            orderBy: {
              createdAt: "desc",
            },
          });

          const totalReplies = await prisma.videoCommentReply.count({
            where: {
              comment_id: input.comment_id,
              is_deleted: false,
            },
          });

          const total_page = Math.ceil(totalReplies / input.limit);

          return {
            total_page,
            total_comments: totalReplies,
            next_page: input.page + 1 > total_page ? null : input.page + 1,
            previos_page: input.page - 1 < 1 ? null : input.page - 1,
            comments: replies.map(reply => {
              return {
                reply_count: 0,
                content: reply.text,
                createdAt: reply.createdAt,
                isUpdated: reply.createdAt !== reply.updatedAt,
                like_count: reply._count.VideoCommentLike,
                dislike_count: reply._count.VideoCommentDissLike,
                idLiked: reply.VideoCommentLike.length > 0,
                isDissLiked: reply.VideoCommentDissLike.length > 0,
                id: reply.id,
                user: {
                  id: reply.User.id,
                  name: reply.User.name,
                  avatar: reply.User.image
                    ? env.S3_PUBLIC_ENDPOINT + "/" + reply.User.image.key
                    : `${env.S3_PUBLIC_VIDEO_ENDPOINT}/thumbnail/default.svg`,
                },
              };
            }),
          };
        }

        const comments = await prisma.videoComment.findMany({
          where: {
            video_id: input.video_id,
            is_deleted: false,
          },
          include: {
            _count: {
              select: {
                VideoCommentDissLike: true,
                VideoCommentLike: true,
                replies: true,
              },
            },
            VideoCommentDissLike: {
              where: {
                user_id: ctx.session?.user.id,
              },
              select: {
                id: true,
              },
            },
            VideoCommentLike: {
              where: {
                user_id: ctx.session?.user.id,
              },
              select: {
                id: true,
              },
            },
            User: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          take: input.limit,
          skip: (input.page - 1) * input.limit,
          orderBy: {
            createdAt: "desc",
          },
        });

        const totalComments = await prisma.videoComment.count({
          where: {
            video_id: input.video_id,
            is_deleted: false,
          },
        });

        const total_page = Math.ceil(totalComments / input.limit);

        return {
          total_page,
          total_comments: totalComments,
          next_page: input.page + 1 > total_page ? null : input.page + 1,
          previos_page: input.page - 1 < 1 ? null : input.page - 1,
          comments: comments.map(comment => {
            return {
              reply_count: comment._count.replies,
              content: comment.text,
              createdAt: comment.createdAt,
              isUpdated: comment.createdAt.getTime() !== comment.updatedAt.getTime(),
              like_count: comment._count.VideoCommentLike,
              dislike_count: comment._count.VideoCommentDissLike,
              idLiked: comment.VideoCommentLike.length > 0,
              isDissLiked: comment.VideoCommentDissLike.length > 0,
              id: comment.id,
              user: {
                id: comment.User.id,
                name: comment.User.name,
                avatar: comment.User.image
                  ? env.S3_PUBLIC_ENDPOINT + "/" + comment.User.image.key
                  : `${env.S3_PUBLIC_VIDEO_ENDPOINT}/thumbnail/default.svg`,
              },
            };
          }),
        };
      } catch (error) {
        logger.error("comment.getCommentsForVideo", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),

  createNewCommentForVideo: protectedApiProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/video/{video_id}/comment",
        summary: "Create a new comment for a video",
        protect: true,
        tags: ["comment", "Video"],
      },
    })
    .input(
      z.object({
        video_id: z.string(),
        comment_id: z.string().optional(),
        content: z.string(),
      }),
    )
    .output(
      z.object({
        id: z.string(),
        content: z.string(),
        createdAt: z.date(),
        user: z.object({
          id: z.string(),
          name: z.string(),
          avatar: z.string(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.comment_id) {
          const reply = await prisma.videoCommentReply.create({
            data: {
              text: input.content,
              user_id: ctx.session.user.id,
              comment_id: input.comment_id,
            },
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          });

          return {
            id: reply.id,
            content: reply.text,
            createdAt: reply.createdAt,
            user: {
              id: reply.User.id,
              name: reply.User.name,
              avatar: reply.User.image?.key
                ? env.S3_PUBLIC_ENDPOINT + "/" + reply.User.image.key
                : `${env.S3_PUBLIC_VIDEO_ENDPOINT}/thumbnail/default.svg`,
            },
          };
        }

        const comment = await prisma.videoComment.create({
          data: {
            text: input.content,
            user_id: ctx.session.user.id,
            video_id: input.video_id,
          },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        });

        return {
          id: comment.id,
          content: comment.text,
          createdAt: comment.createdAt,
          user: {
            id: ctx.session.user.id,
            name: comment.User.name,
            avatar: comment.User.image?.key
              ? env.S3_PUBLIC_ENDPOINT + "/" + comment.User.image.key
              : `${env.S3_PUBLIC_VIDEO_ENDPOINT}/thumbnail/default.svg`,
          },
        };
      } catch (error) {
        logger.error("comment.createNewCommentForVideo", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),

  updateCommentForVideo: protectedApiProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/video/{video_id}/comment/{comment_id}",
      },
    })
    .input(
      z.object({
        video_id: z.string(),
        comment_id: z.string(),
        content: z.string(),
      }),
    )
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      try {
        const comment = await prisma.videoComment.findUnique({
          where: {
            id: input.comment_id,
            is_deleted: false,
          },
        });
        if (!comment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Comment not found",
          });
        }
        await prisma.videoComment.update({
          data: {
            text: input.content,
          },
          where: {
            id: comment.id,
          },
        });
      } catch (error) {
        logger.error("comment.updateCommentForVideo", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),
  deleteCommentForVideo: protectedApiProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/video/{video_id}/comment/{comment_id}",
        summary: "Delete a comment for a video",
        protect: true,
        tags: ["comment", "Video"],
      },
    })
    .input(
      z.object({
        video_id: z.string(),
        comment_id: z.string(),
        isReply: z.boolean().default(false),
      }),
    )
    .output(z.void())
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
            message: "you are not authorized to delete this comment",
          });
        }
        if (input.isReply) {
          const comment = await prisma.videoCommentReply.findUnique({
            where: {
              id: input.comment_id,
              is_deleted: false,
            },
            select: {
              id: true,
              comment: {
                select: {
                  Video: {
                    select: {
                      channel: {
                        select: {
                          id: true,
                          user_id: true,
                        },
                      },
                    },
                  },
                  user_id: true,
                },
              },
            },
          });
          if (!comment) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Comment not found",
            });
          }
          if (
            !(
              comment.comment.user_id === user.id ||
              comment.comment.Video.channel.user_id === user.id ||
              user.role === "ADMIN"
            )
          ) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "you are not authorized to delete this comment",
            });
          }
          await prisma.videoCommentReply.update({
            where: {
              id: comment.id,
            },
            data: {
              is_deleted: true,
              delete_reason:
                comment.comment.user_id === user.id
                  ? "User deleted"
                  : comment.comment.Video.channel.user_id === user.id
                    ? "Channel creater deleted"
                    : "Admin deleted",
            },
          });
          return;
        } else {
          const comment = await prisma.videoComment.findUnique({
            where: {
              id: input.comment_id,
              is_deleted: false,
            },
            select: {
              id: true,
              Video: {
                select: {
                  channel: {
                    select: {
                      id: true,
                      user_id: true,
                    },
                  },
                },
              },
              user_id: true,
            },
          });
          if (!comment) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Comment not found",
            });
          }
          if (
            !(
              comment.user_id === user.id ||
              comment.Video.channel.user_id === user.id ||
              user.role === "ADMIN"
            )
          ) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "you are not authorized to delete this comment",
            });
          }
          await prisma.videoComment.update({
            where: {
              id: comment.id,
            },
            data: {
              is_deleted: true,
              delete_reason:
                comment.user_id === user.id
                  ? "User deleted"
                  : comment.Video.channel.user_id === user.id
                    ? "Channel creater deleted"
                    : "Admin deleted",
            },
          });
          return;
        }
      } catch (error) {
        logger.error("comment.deleteCommentForVideo", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),

  likeComment: protectedApiProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/video/{video_id}/comment/{comment_id}/like",
        summary: "Like a comment",
        protect: true,
        tags: ["comment", "Video"],
      },
    })
    .input(
      z.object({
        video_id: z.string(),
        comment_id: z.string(),
        doLike: z.boolean(),
      }),
    )
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      try {
        if (!input.doLike) {
          await prisma.videoCommentLike.delete({
            where: {
              comment_id_user_id: {
                user_id: ctx.session.user.id,
                comment_id: input.comment_id,
              },
            },
          });
          return;
        }
        const comment = await prisma.videoCommentLike.findUnique({
          where: {
            comment_id_user_id: {
              comment_id: input.comment_id,
              user_id: ctx.session.user.id,
            },
          },
        });
        if (!comment) {
          await prisma.videoCommentLike.create({
            data: {
              user_id: ctx.session.user.id,
              comment_id: input.comment_id,
              video_id: input.video_id,
            },
          });
        }
        return;
      } catch (error) {
        logger.error("comment.likeComment", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),
  dislikeComment: protectedApiProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/video/{video_id}/comment/{comment_id}/disslike",
        summary: "Disslike a comment",
        protect: true,
        tags: ["comment", "Video"],
      },
    })
    .input(
      z.object({
        video_id: z.string(),
        comment_id: z.string(),
        doDislike: z.boolean(),
      }),
    )
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      try {
        if (!input.doDislike) {
          await prisma.videoCommentDissLike.delete({
            where: {
              comment_id_user_id: {
                user_id: ctx.session.user.id,
                comment_id: input.comment_id,
              },
            },
          });
          return;
        }
        const comment = await prisma.videoCommentDissLike.findUnique({
          where: {
            comment_id_user_id: {
              comment_id: input.comment_id,
              user_id: ctx.session.user.id,
            },
          },
        });
        if (!comment) {
          await prisma.videoCommentDissLike.create({
            data: {
              user_id: ctx.session.user.id,
              comment_id: input.comment_id,
              video_id: input.video_id,
            },
          });
        }
        return;
      } catch (error) {
        logger.error("comment.dislikeComment", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),
});
