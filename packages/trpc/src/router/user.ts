import { z } from "zod";

// import { prisma } from "@workspace/database";

import { protectedProcedure, publicProcedure, router } from "@/trpc";
import { prisma } from "@workspace/database";
import { TRPCError } from "@trpc/server";

const userZodObject = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().optional(),
  email: z.string(),
  role: z.enum(["ADMIN", "USER"]),
  channel_id: z.string().optional(),
});

export const postRouter = router({
  getUser: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        summary: "Get user",
        description: "Get user",
        path: "/user/{id}",
        protect: true,
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
        image: user.image ?? undefined,
        email: user.email,
        role: user.role as "ADMIN" | "USER",
        channel_id: user.channel_id ?? undefined,
      };
    }),
  getMe: protectedProcedure
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
        image: user.image ?? undefined,
        email: user.email,
        role: user.role as "ADMIN" | "USER",
        channel_id: user.channel_id ?? undefined,
      };
    }),

  updateName: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/user/name",
        summary: "Update user name",
        description: "id fild can only be use by admins",
        protect: true,
      },
    })
    .input(z.object({ name: z.string(), id: z.string().optional() }))
    .output(userZodObject)
    .mutation(async ({ ctx, input }) => {
      let id = ctx.session.user.id;
      if (input.id) {
        const user = await prisma.user.findUnique({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (!user || user.role !== "ADMIN") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You are not authorized to update this user",
          });
        }
        id = input.id;
      }

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
        image: user.image ?? undefined,
        email: user.email,
        role: user.role as "ADMIN" | "USER",
        channel_id: user.channel_id ?? undefined,
      };
    }),

  updateRole: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/user/role",
        summary: "Update user role",
        description: "this is only for admins",
        protect: true,
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
        image: user.image ?? undefined,
        email: user.email,
        role: user.role as "ADMIN" | "USER",
        channel_id: user.channel_id ?? undefined,
      };
    }),

  getPreSignedUrlForImage: protectedProcedure
    // .input(z.object({ }))
    .output(z.object({ url: z.string() }))
    .mutation(async ({ ctx, input }) => {
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
    //   if (user.id !== input.id) {
    //     throw new TRPCError({
    //       code: "UNAUTHORIZED",
    //       message: "You are not authorized to update this user",
    //     });
    //   }
      const url = "https://example.com/image.jpg";
      return { url,  };
    }),
});
