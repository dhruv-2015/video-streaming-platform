import { transcodeVideo } from "@/bullmq/videoTranscoderQueue";
import logger from "../../logger";
import { protectedApiChannelProcedure, router } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { customS3Uploader } from "@workspace/aws";
import { prisma } from "@workspace/database";
import { env } from "@workspace/env";
import { recomandationSystem } from "@workspace/services";
import path from "path";
import { z } from "zod";

export const videoRouter = router({
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
        description: z.string().optional(),
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
  getVideo: protectedApiChannelProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/channel/video/{video_id}",
        summary: "Get video by id",
        description: "Get video by id for channel owner",
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
        id: z.string(),
        title: z.string(),
        description: z.string(),
        is_ready: z.boolean(),
        thumbnail: z.string(),
        like_count: z.number(),
        disslike_count: z.number(),
        is_like: z.boolean(),
        visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]),
        is_disslike: z.boolean(),
        upload_at: z.date(),
        is_published: z.boolean(),
        published_at: z.date().nullable(),
        view_count: z.number(),
        duration: z
          .number({
            description: "Duration in seconds",
          })
          .nullable(),
        channel: z.object({
          id: z.string(),
          name: z.string(),
          image: z.string(),
          subscriber_count: z.number(),
          slug: z.string(),
        }),
        tags: z.array(z.string()),
        stream: z
          .object({
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
          })
          .nullable(),
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
            is_deleted: false,
          },
          include: {
            channel: {
              select: {
                name: true,
                id: true,
                image: true,
                slug: true,
                subscriber_count: true,
                user_id: true,
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
        if (video.channel.user_id !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not allowed to access this video",
          });
        }

        return {
          id: video.id,
          title: video.title,
          is_ready: video.is_ready,
          description: video.description,
          upload_at: video.published_at ?? video.createdAt,
          thumbnail: video.thumbnail
            ? `${env.S3_PUBLIC_VIDEO_ENDPOINT}/${video.thumbnail.key}`
            : env.S3_PUBLIC_VIDEO_ENDPOINT + "/thumbnail/default.svg",
          like_count: Number(video.like_count),
          disslike_count: Number(video.dislike_count),
          view_count: Number(video.view_count),
          visibility: video.video_type as "PUBLIC" | "PRIVATE" | "UNLISTED",
          duration: video.VideoFile ? video.VideoFile.duration : null,
          is_published: video.is_published,
          published_at: video.published_at,
          channel: {
            id: video.channel.id,
            name: video.channel.name,
            subscriber_count: video.channel.subscriber_count,
            slug: video.channel.slug,
            image: video.channel.image
              ? `${env.S3_PUBLIC_VIDEO_ENDPOINT}/${video.channel.image.key}`
              : env.S3_PUBLIC_VIDEO_ENDPOINT + "/thumbnail/default.svg",
          },
          tags: video.VideoTags.map(tag => tag.tag),
          is_like: video.VideoLike.length > 0,
          is_disslike: video.VideoDissLike.length > 0,
          stream: video.VideoFile
            ? {
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
              }
            : null,
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
              is_published: true,
              video_type: true,
              VideoTags: {
                select: {
                  tag: true,
                },
              },
              description: true,
              id: true,
            },
          });
          if (video.is_published && video.video_type === "PUBLIC") {
            await recomandationSystem.addOrUpdateVideo(
              video.id,
              video.title,
              video.description,
              video.VideoTags.map(vt => vt.tag),
            );
          } else {
            await recomandationSystem.deleteVideo(video.id);
          }
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
  updateVideo: protectedApiChannelProcedure
    .input(
      z.object({
        video_id: z.string(),
        title: z.string(),
        description: z.string(),
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
        const video = await prisma.video.findUnique({
          where: {
            id: input.video_id,
            channel_id: ctx.channel.id,
          },
        });
        if (!video) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video not found",
          });
        }
        const newVid = await prisma.video.update({
          where: {
            id: input.video_id,
            channel_id: ctx.channel.id,
          },
          data: {
            title: input.title,
            description: input.description,
          },
          select: {
            title: true,
            is_published: true,
            video_type: true,
            VideoTags: {
              select: {
                tag: true,
              },
            },
            description: true,
            id: true,
          },
        });
        if (newVid.is_published && newVid.video_type === "PUBLIC") {
          await recomandationSystem.addOrUpdateVideo(
            newVid.id,
            newVid.title,
            newVid.description,
            newVid.VideoTags.map(vt => vt.tag),
          );
        } else {
          await recomandationSystem.deleteVideo(video.id);
        }
        return;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error("channel.video.updateVideo", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `something went wrong while updating video`,
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
        video_id: z.string({
          description: "video id",
        }),
        file_name: z.string({
          description: "file name (must be video file name with extension)",
        }),
        file_size: z.number({
          description: "file size in bytes (max 10GB)",
        }),
      }),
    )
    .output(
      z.object({
        url: z.string(),
        fileId: z.string(),
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
          await prisma.tempFileUpload.create({
            data: {
              bucket: video.orignal_file.bucket,
              expires: new Date(),
              key: video.orignal_file.key,
            },
          });
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error("channel.video.getPresignedUrlForVideo", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong while getting video",
        });
      }
      if (input.file_size > 10 * 1024 * 1024 * 1024) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Video file size should be less than 10GB",
        });
      }
      try {
        const s3url = await customS3Uploader.generatePresignedUrl({
          bucket: env.S3_VIDEO_BUCKET,
          fileName: input.file_name,
          maxSizeBytes: input.file_size,
          expiresIn: 24 * 60 * 60, // 24 hours
          for: "temp",
        });
        const file = await prisma.tempFileUpload.create({
          data: {
            bucket: s3url.s3Data.bucket,
            key: s3url.s3Data.key,
            expires: s3url.s3Data.expire,
            // orignal_file: {
            //   bucket: s3url.s3Data.bucket,
            //   key: s3url.s3Data.key,
            // },
          },
        });
        return {
          url: s3url.url,
          fileId: file.id,
        };
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
        fileId: z.string(),
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
        const videoFile = await prisma.tempFileUpload.findUnique({
          where: {
            id: input.fileId,
          },
        });

        if (!videoFile) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Video file not found on server. please upload video first",
          });
        }
        try {
          const res = await customS3Uploader.checkFileExists({
            bucket: videoFile.bucket,
            key: videoFile.key,
          });
          console.log("verifyVideoUpload debug");
          if (res) {
            try {
              await customS3Uploader.copyObject(
                {
                  bucket: videoFile.bucket,
                  key: videoFile.key,
                },
                {
                  bucket: env.S3_VIDEO_BUCKET,
                  key: `video/${video.id}${path.extname(videoFile.key)}`,
                },
              );
              await customS3Uploader.deleteFile(videoFile.bucket, videoFile.key);
              await prisma.video.update({
                where: {
                  id: input.video_id,
                },
                data: {
                  orignal_file: {
                    bucket: env.S3_VIDEO_BUCKET,
                    key: `video/${video.id}${path.extname(videoFile.key)}`,
                  },
                  is_uploaded: true,
                },
              });

              await transcodeVideo(input.video_id, {
                bucket: env.S3_VIDEO_BUCKET,
                key: `video/${video.id}${path.extname(videoFile.key)}`,
              });
            } catch (error) {
              logger.error("channel.video.verifyVideoUpload", error);
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "something went wrong while transcoding video",
              });
            }
            return "Video uploaded successfully";
          } else {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Video file not found on server. please upload video first",
            });
          }
        } catch (error) {
          if (error instanceof TRPCError) {
            throw error;
          }
          logger.error("channel.video.verifyVideoUpload", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "something went wrong while updating video",
          });
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
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
    .output(z.object({
      published_at: z.date(),
    }))
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
      // if (!video.is_ready) {
      //   throw new TRPCError({
      //     code: "BAD_REQUEST",
      //     message: "Video is not ready yet. please wait",
      //   });
      // }
      try {
        const newVid = await prisma.video.update({
          where: {
            id: input.video_id,
          },
          data: {
            is_published: true,
            published_at: new Date(),
          },
          include: {
            VideoTags: {
              select: {
                tag: true,
              },
            },
          },
        });
        if (video.is_ready) {
          await recomandationSystem.addOrUpdateVideo(
            video.id,
            video.title,
            video.description,
            newVid.VideoTags.map(vt => vt.tag),
          );
        }

        return {
          published_at: newVid.published_at!,
        };
      } catch (error) {
        logger.error("channel.video.publishVideo", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong while publishing video",
        });
      }
    }),

    changeVisibility: protectedApiChannelProcedure
    .input(z.object({
      video_id: z.string(),
      visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.channel) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "you are not authorized to perform this action",
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
            code: "UNAUTHORIZED",
            message: "you are not authorized to perform this action",
          });
        }
        if (!video.is_uploaded) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Video is not uploaded. please upload video first",
          });
        }

        const newVid = await prisma.video.update({
          where: {
            id: input.video_id,
          },
          data: {
            video_type: input.visibility,
          },
          select: {
            id: true,
            is_ready: true,
            is_published: true,
            video_type: true,
            title: true,
            description: true,
            VideoTags: {
              select: {
                tag: true,
              },
            },
          }
        });
        if (newVid.is_published && newVid.video_type === "PUBLIC") {
          await recomandationSystem.addOrUpdateVideo(
            newVid.id,
            newVid.title,
            newVid.description,
            newVid.VideoTags.map(vt => vt.tag),
          );
        } else {
          await recomandationSystem.deleteVideo(newVid.id);
        }
      } catch (error) {
        logger.error("channel.video.changeVisibility", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong while publishing video",
        });
      }
    }),
  deleteVideo: protectedApiChannelProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/channel/video/{video_id}",
        protect: true,
        summary: "Delete video",
        tags: ["Channel", "video"],
      },
    })
    .input(
      z.object({
        video_id: z.string(),
      }),
    )
    .output(z.string())
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
        await recomandationSystem.deleteVideo(video.id);
        return "Video deleted successfully";
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong while deleting video",
        });
      }
    }),

  getPreSignedUrlForThumbnail: protectedApiChannelProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/channel/video/{video_id}/thumbnail-presigned-url",
        protect: true,
        summary: "Get presigned url for video thumbnail",
        tags: ["Channel", "video"],
      },
    })
    .input(
      z.object({
        video_id: z.string(),
        file_name: z.string(),
        file_size: z.number(),
      }),
    )
    .output(
      z.object({
        url: z.string(),
        fileId: z.string(),
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
            channel_id: ctx.channel.id,
          },
        });
        if (!video || video.channel_id !== ctx.channel.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video not found",
          });
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error("channel.video.getPreSignedUrlForThumbnail", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong while getting video",
        });
      }

      if (input.file_size > 15 * 1024 * 1024) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File size should be less than 15MB",
        });
      }
      const s3url = await customS3Uploader.generatePresignedUrl({
        bucket: env.S3_VIDEO_BUCKET,
        fileName: input.file_name,
        maxSizeBytes: input.file_size,
        for: "temp",
      });

      const file = await prisma.tempFileUpload.create({
        data: {
          bucket: s3url.s3Data.bucket,
          expires: s3url.s3Data.expire,
          key: s3url.s3Data.key,
        },
      });
      return {
        url: s3url.url,
        fileId: file.id,
      };
    }),

  uploadThumbnail: protectedApiChannelProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/channel/video/{video_id}/thumbnail",
        protect: true,
        summary: "Upload thumbnail for video",
        tags: ["Channel", "video"],
      },
    })
    .input(
      z.object({
        video_id: z.string(),
        fileId: z.string(),
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
        const file = await prisma.tempFileUpload.findUnique({
          where: {
            id: input.fileId,
          },
        });
        if (!file) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "File not found",
          });
        }
        const video = await prisma.video.findUnique({
          where: {
            id: input.video_id,
            channel_id: ctx.channel.id,
          },
        });

        if (!video) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video not found",
          });
        }

        await customS3Uploader.copyObject(
          {
            bucket: file.bucket,
            key: file.key,
          },
          {
            bucket: env.S3_VIDEO_BUCKET,
            key: `thumbnail/${video.id}${path.extname(file.key)}`,
          },
        );

        await prisma.video.update({
          data: {
            thumbnail: {
              bucket: env.S3_VIDEO_BUCKET,
              key: `thumbnail/${video.id}${path.extname(file.key)}`,
            },
          },
          where: {
            id: video.id,
          },
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error("channel.video.uploadThumbnail", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong while uploading thumbnail",
        });
      }
    }),

  deleteThumbnail: protectedApiChannelProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/channel/video/{video_id}/thumbnail",
        protect: true,
        summary: "Delete thumbnail for video",
        tags: ["Channel", "video"],
      },
    })
    .input(
      z.object({
        video_id: z.string(),
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
      const video = await prisma.video
        .findUnique({
          where: {
            id: input.video_id,
            channel_id: ctx.channel.id,
          },
        })
        .catch(error => {
          logger.error("channel.video.deleteThumbnail", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "something went wrong while getting video",
          });
        });
      if (!video) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video not found",
        });
      }
      if (video.thumbnail) {
        try {
          await prisma.$transaction(async p => {
            await p.video.update({
              data: {
                thumbnail: null,
              },
              where: {
                id: video.id,
              },
            });
            await customS3Uploader.deleteFile(
              video.thumbnail?.bucket!,
              video.thumbnail?.key!,
            );
          });
        } catch (error) {
          logger.error("channel.video.deleteThumbnail", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "something went wrong while deleting thumbnail",
          });
        }
      }
    }),

  // getVideos: protectedApiChannelProcedure
  //   .input(
  //     z.object({
  //       page: z.number().default(1),
  //       limit: z.number().default(10),
  //     }),
  //   )
  //   .output(
  //     z.object({
  //       videos: z.array(
  //         z.object({
  //           id: z.string(),
  //           title: z.string(),
  //           description: z.string(),
  //           thumbnail: z.string(),
  //           channel_id: z.string(),
  //           video_type: z.string(),
  //           created_at: z.date(),
  //           published_at: z.date(),
  //           view_count: z.number(),
  //           like_count: z.number(),
  //           dislike_count: z.number(),
  //           comments: z.number(),
  //         }),
  //       ),
  //       total_videos: z.number(),
  //       next_page: z.number().nullable(),
  //       prev_page: z.number().nullable(),
  //       total_page: z.number(),
  //     }),
  //   )
  //   .query(async ({ ctx,input }) => {
  //     if (!ctx.channel) {
  //       throw new TRPCError({
  //         code: "NOT_FOUND",
  //         message: "Channel not found",
  //       });
  //     }
  //     const totalVideo = await prisma.video.count({
  //       where: {
  //         channel_id: ctx.channel.id,
  //         is_deleted: false,
  //         is_uploaded: true,
  //       },
  //     });
  //     const videos = await prisma.video.findMany({
  //       where: {
  //         channel_id: ctx.channel.id,
  //         is_deleted: false,
  //         is_uploaded: true,
  //       },
  //       orderBy: {
  //         published_at: "desc",
  //       },
  //       select: {
  //         id: true,
  //         title: true,
  //         description: true,
  //         thumbnail: true,
  //         like_count: true,
  //         channel_id: true,
  //         video_type: true,
  //         createdAt: true,
  //         published_at: true,
  //         view_count: true,
  //         dislike_count: true,
  //         _count: {
  //           select: {
  //             VideoComment: true,
  //           },
  //         },
  //       },
  //     });
  //     const total_page = Math.ceil(totalVideo / input.limit);
  //     return {
  //       total_page,
  //       total_videos: totalVideo,
  //       next_page: input.page < totalVideo ? input.page + 1 : null,
  //       prev_page: input.page > 1 ? input.page - 1 : null,
  //       videos: videos.map(video => ({
  //         channel_id: video.channel_id,
  //         comments: video._count.VideoComment,
  //         created_at: video.createdAt,
  //         description: video.description,
  //         dislike_count: Number(video.dislike_count),
  //         id: video.id,
  //         like_count: Number(video.like_count),
  //         published_at: video.published_at,
  //         thumbnail: video.thumbnail ? `${env.S3_PUBLIC_VIDEO_ENDPOINT}/${video.thumbnail}` : `${env.S3_PUBLIC_VIDEO_ENDPOINT}/thumbnail/default.svg`,
  //         title: video.title,
  //         video_type  : video.video_type.toString(),
  //         view_count: Number(video.view_count),
  //       }))
  //     };

  //     // const comments = await prisma.videoComment.count({
  //     //   where: {
  //     //     video_id: videos.id
  //     //   }
  //     // })
  //   }),
});
