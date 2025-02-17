import { protectedApiProcedure, publicProcedure, router } from "../trpc";
import { userRouter } from "./user";
import { channelRouter } from "./channel";
import { studioRouter } from "./studio";
import { prisma } from "@workspace/database";
import { customS3Uploader } from "@workspace/aws";
import { z } from "zod";
// import { tagsRouter } from "./tags";

export const trpcRouter = router({
  user: userRouter,
  channel: channelRouter,
  studio: studioRouter,
  removeExpiredFilesFromTempUpload: publicProcedure.meta({
    openapi: {
      method: "GET",
      path: "/remove-expired-files",
      summary: "Remove expired files from temp upload",
      tags: ["cleanup"],
    }
  }).input(z.void()).output(z.void()).query(async ({ ctx }) => {
    try {

      const expiredFiles = await prisma.tempFileUpload.findMany({
        where: {
          expires: {
            lt: new Date(),
          }
        },
        take: 10,
      })
      Promise.all(expiredFiles.map(file => {
        return async () => {
          try {
            await customS3Uploader.deleteFile(file.bucket, file.key);
            await prisma.tempFileUpload.delete({
              where: {
                id: file.id
              }
            })
          } catch (error) {}
        }
      }))
    } catch (error) {
      
    }
  })
  // tags: tagsRouter
});
