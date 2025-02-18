import { prisma, redis } from "@workspace/database";
import { Queue } from "bullmq";
import logger from "../logger";
interface MyData {
  file: {
    key: string;
    bucket: string;
  };
  video_id: string;
}

redis.on("error", (error) => {
  logger.error("❌ REDIS ERROR", error);
  // process.exit(1);
});
redis.on("connect", () => {
  logger.info("✅ Redis connected");
})


const videoTranscoderQueue = new Queue<MyData>("video_transcoder", {
  connection: redis,
  prefix: "queue",
});

export async function transcodeVideo(
  video_id: string,
  file: { key: string; bucket: string },
) {
  try {
    
    const oldTranscoding = await prisma.videoTranscoding.findUnique({
      where: {
        video_id: video_id,
      },
    });
    if (oldTranscoding) {
      return {
        job_id: oldTranscoding.job_id,
      };
    }
    
    
    console.log("transcodeVideo", video_id, file);
    const job = await videoTranscoderQueue.add(
      "transcode_video",
      {
        file: file,
        video_id: video_id,
      },
      {
        attempts: 3,
        // removeOnComplete: {
          //   age: 1000 * 60 * 60 * 24 * 7, // 7 days
        //   count: 1000,
        // },
        removeOnComplete: true,
        removeOnFail: {
          count: 100,
        },
      },
    );

    console.log("job", job.id);
    


    await prisma.videoTranscoding.create({
      data: {
        job_id: job.id!,
        video_id: video_id,
        status: "pending",
      },
    });

    return {
      job_id: job.id,
    };
  } catch (error) {
    console.log(error, "error");
    
    logger.error("transcodeVideo", error);
    throw new Error("Failed to transcode video");
  }
  //   return await videoTranscoderQueue.add("transcode_video", {
  //     transcode_id: transcode_id,
  //     file: file,
  //   });
}
