import { protectedApiProcedure, publicProcedure, router } from "../trpc";
import { userRouter } from "./user";
import { channelRouter } from "./channel";
import { studioRouter } from "./studio";
import { prisma } from "@workspace/database";
import { customS3Uploader } from "@workspace/aws";
import { z } from "zod";
import { videoRouter } from "./video";
import { playlistRouter } from "./playlist";
import { env } from "@workspace/env";
import logger from "../logger";
import { recomandationSystem } from "@workspace/services";
import { likeRouter } from "./likes";
import { historyRouter } from "./history";
import { watchLaterRouter } from "./watchLater";
import { commentsRouter } from "./comment";
// import { tagsRouter } from "./tags";

export const trpcRouter = router({
  user: userRouter,
  channel: channelRouter,
  studio: studioRouter,
  video: videoRouter,
  like: likeRouter,
  history: historyRouter,
  watchLater: watchLaterRouter,

  comment: commentsRouter,
  playlist: playlistRouter,
  removeExpiredFilesFromTempUpload: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/remove-expired-files",
        summary: "Remove expired files from temp upload",
        tags: ["cleanup"],
      },
    })
    .input(z.void())
    .output(z.void())
    .query(async ({ ctx }) => {
      try {
        const expiredFiles = await prisma.tempFileUpload.findMany({
          where: {
            expires: {
              lt: new Date(),
            },
          },
          take: 10,
        });
        // Promise.all(
        //   expiredFiles.map(file => {
        //     return async () => {
        //       try {
        //         await customS3Uploader.deleteFile(file.bucket, file.key);
        //         await prisma.tempFileUpload.delete({
        //           where: {
        //             id: file.id,
        //           },
        //         });
        //       } catch (error) {}
        //     };
        //   }),
        // );

        const buckets: string[] = []
        const files = expiredFiles.map(file => {
          if (!buckets.includes(file.bucket)) {
            buckets.push(file.bucket)
          }
          return {
            bucket: file.bucket,
            key: file.key,
          }
        })

        for (let i = 0; i < buckets.length; i++) {
          const filesToDelete = files.filter(file => file.bucket === buckets[i]).map(file => file.key)
          const chunkSize = 800;
          const chunkedFilesToDelete = filesToDelete.reduce((acc: string[][], _, index) => {
            const chunkIndex = Math.floor(index / chunkSize);
            if (!acc[chunkIndex]) {
              acc[chunkIndex] = [];
            }
            acc[chunkIndex].push(_);
            return acc;
          }, []);
          for (let j = 0; j < chunkedFilesToDelete.length; j++) {
            await customS3Uploader.deleteFiles(buckets[i]!, chunkedFilesToDelete[j]!);
          }
        }

        await prisma.tempFileUpload.deleteMany({
          where: {
            id: {
              in: expiredFiles.map(file => file.id),
            },
          },
        });

        // const buckets = files.filter(file => file.bucket)
        
      } catch (error) {
        logger.error("removing expired files from temp upload failed", error);
      }
    }),
  cleanup: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/cleanup",
        tags: ["cleanup"],
        summary: "remove files from s3 which are not avalable in database",
      },
    })
    .input(z.void())
    .output(z.void())
    .query(async ({ ctx }) => {
      // remove expire files from tempupload
      try {
        const expiredFiles = await prisma.tempFileUpload.findMany({
          where: {
            expires: {
              lt: new Date(),
            },
          },
          take: 10,
        });
        // Promise.all(
        //   expiredFiles.map(file => {
        //     return async () => {
        //       try {
        //         await customS3Uploader.deleteFile(file.bucket, file.key);
        //         await prisma.tempFileUpload.delete({
        //           where: {
        //             id: file.id,
        //           },
        //         });
        //       } catch (error) {}
        //     };
        //   }),
        // );

        const buckets: string[] = []
        const files = expiredFiles.map(file => {
          if (!buckets.includes(file.bucket)) {
            buckets.push(file.bucket)
          }
          return {
            bucket: file.bucket,
            key: file.key,
          }
        })

        for (let i = 0; i < buckets.length; i++) {
          const filesToDelete = files.filter(file => file.bucket === buckets[i]).map(file => file.key)
          const chunkSize = 800;
          const chunkedFilesToDelete = filesToDelete.reduce((acc: string[][], _, index) => {
            const chunkIndex = Math.floor(index / chunkSize);
            if (!acc[chunkIndex]) {
              acc[chunkIndex] = [];
            }
            acc[chunkIndex].push(_);
            return acc;
          }, []);
          for (let j = 0; j < chunkedFilesToDelete.length; j++) {
            await customS3Uploader.deleteFiles(buckets[i]!, chunkedFilesToDelete[j]!);
          }
        }

        await prisma.tempFileUpload.deleteMany({
          where: {
            id: {
              in: expiredFiles.map(file => file.id),
            },
          },
        });

        // const buckets = files.filter(file => file.bucket)
        
      } catch (error) {
        logger.error("removing expired files from temp upload failed", error);
      }

      // remove transcoded files
      // try {
      //   const videos = await prisma.video.findMany();
      // const video_ids = videos.map(video => video.id);
      // const orignalfiles = await customS3Uploader.getAllFiles(
      //   env.S3_VIDEO_BUCKET,
      //   "video",
      // );
      // const transcodedfiles = await customS3Uploader.getAllFiles(
      //   env.S3_VIDEO_BUCKET,
      //   "transcoded",
      // );

      // const filestodelete = [
      //   ...orignalfiles
      //     .filter(file => {
      //       return !video_ids.includes(file.split(".")[0]!);
      //     })
      //     .map(file => `video/${file}`),
      //   ...transcodedfiles
      //     .filter(file => {
      //       return !video_ids.includes(file.split("/")[1]!);
      //     })
      //     .map(file => `transcoded/${file}`),
      // ];

      // const chunkSize = 800;
      // const chunkedFilesToDelete = filestodelete.reduce((acc: string[][], _, index) => {
      //   const chunkIndex = Math.floor(index / chunkSize);
      //   if (!acc[chunkIndex]) {
      //     acc[chunkIndex] = [];
      //   }
      //   acc[chunkIndex].push(_);
      //   return acc;
      // }, []);
      // for (let i = 0; i < chunkedFilesToDelete.length; i++) {
      //   await customS3Uploader.deleteFiles(env.S3_VIDEO_BUCKET, chunkedFilesToDelete[i]!);
      // }
      // } catch (error) {
      //   logger.error("removing transcoded files failed", error);
        
      // }
    }),

    cleanRecomandationSystem: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/clean-recomandation-system",
        tags: ["cleanup"],
      }
    }).input(z.void()).output(z.void()).query(async ({ ctx }) => {
      await recomandationSystem.clearCollection();
      recomandationSystem.init();
      const videos = await prisma.video.findMany({
        include: {
          VideoTags: {
            select: {
              tag: true,
            }
          }
        }
      });
      await Promise.all(videos.map(video => {
        return async () => {
          await recomandationSystem.addOrUpdateVideo(video.id,video.title, video.description, video.VideoTags.map(tag => tag.tag));
        }
      }))
    })
  // tags: tagsRouter
});
