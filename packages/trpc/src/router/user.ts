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
  image: z.string().url().optional(),
  email: z.string(),
  role: z.enum(["ADMIN", "USER"]),
  channel_id: z.string().optional(),
});

export const userRouter = router({
  isLogin: protectedApiProcedure.query(async ({ ctx }) => {
    return {
      isLoggedin: !!ctx.session.user,
    };
  }),
  getUser: protectedApiProcedure
    .meta({
      openapi: {
        method: "GET",
        summary: "Get user by id",
        description: "Get user",
        path: "/user/{id}",
        protect: true,
        tags: ["User"],

      },
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .output(userZodObject)
    .query(async ({ ctx, input }) => {
      if (input.id) {
        const user = await prisma.user.findUnique({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (user?.id === input.id) {
          return {
            id: user.id,
            name: user.name,
            image: user.image ? `${env.S3_PUBLIC_ENDPOINT}/${user.image.bucket}/${user.image.key}` : undefined,
            email: user.email,
            role: user.role as "ADMIN" | "USER",
            channel_id: user.channel_id ?? undefined,
          };
        }
        if (user?.role !== "ADMIN") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You are not authorized to perform this action",
          });
        }
      }
      const user = await prisma.user.findUnique({
        where: {
          id: input.id,
        },
      });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      user.channel_id;
      return {
        id: user.id,
        name: user.name,
        image: user.image ? `${env.S3_PUBLIC_ENDPOINT}/${user.image.bucket}/${user.image.key}` : undefined,
        email: user.email,
        role: user.role as "ADMIN" | "USER",
        channel_id: user.channel_id ?? undefined,
      };
    }),
  getMe: protectedApiProcedure
    .meta({
      openapi: {
        method: "GET",
        summary: "Get user",
        description: "Get user",
        path: "/user",
        protect: true,
        tags: ["User"],
      },
    })
    .input(z.void())
    .output(
      z.object({
        id: z.string(),
        name: z.string(),
        image: z.string().optional(),
        email: z.string(),
        role: z.enum(["ADMIN", "USER"]),
        channel_id: z.string().optional(),
      }),
    )
    .query(async ({ ctx }) => {
      const user = await prisma.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      return {
        id: user.id,
        name: user.name,
        // image: !user.image?.startsWith("http") ?  `${env.S3_PUBLIC_ENDPOINT}/${user.image}`: user.image ?? undefined,
        image: user.image ? `${env.S3_PUBLIC_ENDPOINT}/${user.image.key}` : undefined,
        email: user.email,
        role: user.role as "ADMIN" | "USER",
        channel_id: user.channel_id ?? undefined,
      };
    }),

  updateName: protectedApiProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/user/name",
        summary: "Update user name",
        protect: true,
        tags: ["User"],
      },
    })
    .input(z.object({ name: z.string() }))
    .output(userZodObject)
    .mutation(async ({ ctx, input }) => {
      let id = ctx.session.user.id;

      const user = await prisma.user.update({
        where: {
          id: id,
        },
        data: {
          name: input.name,
        },
      });
      return {
        id: user.id,
        name: user.name,
        // image: user.image ?? undefined,
        image: user.image ? `${env.S3_PUBLIC_ENDPOINT}/${user.image.bucket}/${user.image.key}` : undefined,
        email: user.email,
        role: user.role as "ADMIN" | "USER",
        channel_id: user.channel_id ?? undefined,
      };
    }),

  updateRole: protectedApiProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/user/role",
        summary: "Update user role",
        description: "this is only for admins",
        protect: true,
        tags: ["User"],
      },
    })
    .input(z.object({ id: z.string(), role: z.enum(["ADMIN", "USER"]) }))
    .output(userZodObject)
    .mutation(async ({ ctx, input }) => {
      const adminUser = await prisma.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (!adminUser || adminUser.role !== "ADMIN") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to update this user",
        });
      }

      const user = await prisma.user.update({
        where: {
          id: input.id,
        },
        data: {
          role: input.role,
        },
      });
      return {
        id: user.id,
        name: user.name,
        // image: user.image ?? undefined,
        image:user.image ? `${env.S3_PUBLIC_ENDPOINT}/${user.image.bucket}/${user.image.key}` : undefined,
        email: user.email,
        role: user.role as "ADMIN" | "USER",
        channel_id: user.channel_id ?? undefined,
      };
    }),

  getPreSignedUrlForImage: protectedApiProcedure
    // .input(z.object({ }))
    .meta({
      openapi: {
        method: "GET",
        path: "/user/image/getPresignedUrl",
        summary: "Get presigned url for image upload",
        protect: true,
        tags: ["User"],
      },
    })
    .input(
      z.object({
        image_name: z.string({
          description: "image name with extension",
        }),
        image_size: z.number({
          description: "image size in bytes (max 15MB)",
        }),
      }),
    )
    .output(z.object({ url: z.string(), fileId: z.string() }))
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
            message: "You are not authorized to perform this action",
          });
        }
      } catch (error) {
        logger.error("users.getPreSignedUrlForImage", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong with database",
        });
      }
      try {
        if (input.image_size > (15 * 1024 * 1024)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Image size should be less than 15MB",
          });
        }
        const s3url = await customS3Uploader.generatePresignedUrl({
          bucket: env.S3_FILES_BUCKET,
          fileName: input.image_name,
          maxSizeBytes: input.image_size,
          for: "avatar"
        });
        try {
          const tempFile = await prisma.tempFileUpload.create({
            data: {
              bucket: s3url.s3Data.bucket,
              key: s3url.s3Data.key,
              expires: s3url.s3Data.expire,
            },
          });
          return {
            url: s3url.url,
            fileId: tempFile.id,
          };
        } catch (error) {
          logger.error("users.getPreSignedUrlForImage", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "something went wrong with saving database",
          });
        }
      } catch (error) {
        logger.error("users.getPreSignedUrlForImage", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong with uploading image",
        });
      }
    }),
  updateImage: protectedApiProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/user/image",
        summary: "Update user image",
        description:
          "to update user image first get presigned url and fileid and then update image",
        protect: true,
        tags: ["User"],
      },
    })
    .input(
      z.object({
        fileId: z.string(),
      }),
    )
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      try {
        const avatarFile = await prisma.tempFileUpload.findUnique({
          where: {
            id: input.fileId,
          },
        });
        if (!avatarFile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "File not found",
          });
        }
        const fileExists = await customS3Uploader.checkFileExists({
          bucket: avatarFile.bucket,
          key: avatarFile.key,
        })
        if (!fileExists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "File not found",
          });
        }
        await prisma.$transaction([
          prisma.user.update({
            where: {
              id: ctx.session.user.id,
            },
            data: {
              image: {
                bucket: avatarFile.bucket,
                key: avatarFile.key,
              },
            },
          }),
          prisma.tempFileUpload.delete({
            where: {
              id: input.fileId,
            },
          }),
        ]);
        return;
      } catch (error) {
        logger.error("users.updateImage", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "something went wrong with updating image",
        });
      }
    }),
  // video: videoRouter
  // t.middleware(async ({ next, path }) => {})
});
