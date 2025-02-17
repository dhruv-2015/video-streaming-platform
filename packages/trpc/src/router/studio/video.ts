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
            }
          })
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
        const res = await prisma.$transaction(async p => {
          const s3url = await customS3Uploader.generatePresignedUrl({
            bucket: env.S3_VIDEO_BUCKET,
            fileName: input.file_name,
            maxSizeBytes: input.file_size,
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
            try {
              await prisma.$transaction(async p => {
                await p.video.update({
                  where: {
                    id: input.video_id,
                  },
                  data: {
                    is_uploaded: true,
                  },
                });
                console.log("transcoding video");
                
                await transcodeVideo(input.video_id, {
                  bucket: video.orignal_file?.bucket!,
                  key: video.orignal_file?.key!
                })
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
        const newVid = await prisma.video.update({
          where: {
            id: input.video_id,
          },
          data: {
            is_published: true,
          },
          include: {
            VideoTags: {
              select: {
                tag: true,
              },
            } 
          },
        });

        await recomandationSystem.addOrUpdateVideo(
          video.id,
          video.title,
          video.description,
          newVid.VideoTags.map(vt => vt.tag),
        );

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
  .meta({
    openapi: {
      method: "DELETE",
      path: "/channel/video/{video_id}",
      protect: true,
      summary: "Delete video",
      tags: ["Channel", "video"],
    }
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
      }
    })
    .input(z.object(({
      video_id: z.string(),
      file_name: z.string(),
      file_size: z.number()
    })))
    .output(z.object({
      url: z.string(),
      fileId: z.string()
    }))
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
          key: s3url.s3Data.key
        }
      })
      return {
        url: s3url.url,
        fileId: file.id
      }
    }),
  
  uploadThumbnail: protectedApiChannelProcedure
  .meta({
    openapi: {
      method: "PATCH",
      path: "/channel/video/{video_id}/thumbnail",
      protect: true,
      summary: "Upload thumbnail for video",
      tags: ["Channel", "video"]
    }
  })
  .input(z.object({
    video_id: z.string(),
    fileId: z.string(),
  }))
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
          id: input.fileId
        }
      })
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
        }
      })
  
      if (!video) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video not found",
        })
      }
  
      await customS3Uploader.copyObject({
        bucket: file.bucket,
        key: file.key,
      }, {
        bucket: env.S3_VIDEO_BUCKET,
        key: `thumbnail/${video.id}.${path.extname(file.key)}`
      })
  
      await prisma.video.update({
        data: {
          thumbnail_s3_path: {
            bucket: env.S3_VIDEO_BUCKET,
            key: `thumbnail/${video.id}${path.extname(file.key)}`
          }
        },
        where: {
          id: video.id
        }
      })
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
  .input(z.object({
    video_id: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    if (!ctx.channel) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Channel not found",
      });
    }
    const video = await prisma.video.findUnique({
      where: {
        id: input.video_id,
        channel_id: ctx.channel.id,
      }
    }).catch(error => {
      logger.error("channel.video.deleteThumbnail", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "something went wrong while getting video",
      })
    })
    if (!video) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Video not found",
      })
    }
    if (video.thumbnail_s3_path) {
      try {
        await prisma.$transaction(async p => {
          await p.video.update({
            data: {
              thumbnail_s3_path: null
            },
            where: {
              id: video.id
            }
          })
          await customS3Uploader.deleteFile(video.thumbnail_s3_path?.bucket!, video.thumbnail_s3_path?.key!)
        })
      } catch (error) {
        logger.error("channel.video.deleteThumbnail", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong while deleting thumbnail",
        });
      }
    }
    
  })

})