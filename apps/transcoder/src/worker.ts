import { prisma, redis } from "@workspace/database";
import { Job, Worker } from "bullmq";
import { VideoTranscoder } from "./transcoder";
import { Filamanager } from "./FileManager";
import path from "path";
import logger from "./logger";
import { env } from "@workspace/env";
import { recomandationSystem } from "@workspace/services";
interface MyData {
  file: {
    key: string;
    bucket: string;
  };
  video_id: string;
}

Filamanager.createDirectory("./tmp");
export const worker = new Worker<MyData>(
  "video_transcoder",
  async (job: Job) => {
    const videoTranscoder = new VideoTranscoder(
      true,
      "ffmpeg",
      "D:\\bin\\packager.exe"
    );
    try {
    const orignalFile = `./tmp/${job.data.video_id}${path.extname(job.data.file.key)}`;
    const outputDir = `./tmp/transcoded/${job.data.video_id}`;
      await Filamanager.downloadFile(
        job.data.file.bucket,
        job.data.file.key,
        orignalFile,
      );

      await new Promise<void>(async (resolve, reject) => {
        try {
          const res = await videoTranscoder.transcode(orignalFile, outputDir, {
            onFfmpegCommandGenerate(data) {
              // logger.info("ffmpeg", data)
              console.log("transcoding started", job.data.video_id);
            },
            onFfmpegStart(data) {
              // logger.info("ffmpeg", data)
              console.log("transcoding started", job.data.video_id,data.part ,data.args.join(" "));
            },
            onEnd() {
              // resolve()
              console.log("paka + trans done", job.data.video_id);
              
            },
            onFfmpegError(data) {
              logger.error("ffmpeg", data);
            },
            pakagerStart(cmd) {
              console.log("transcoding Ended", job.data.video_id);
              console.log("packaging started", job.data.video_id, cmd);
            },
            pakagerEnd() {
              console.log("packaging Ended");
            },
            pakagerError(error) {
              logger.log("packaging error", error);
            },
          });
          try {
            console.log("uploading hls files", job.data.video_id);

            await Filamanager.uploadHlsFiles(
              outputDir,
              `transcoded/${job.data.video_id}`,
            );
            console.log("uploading hls files done", job.data.video_id);
            try {
              console.log("updateing video", job.data.video_id);
              await prisma.videoFile.create({
                data: {
                  Video: {
                    connect: {
                      id: job.data.video_id,
                    },
                  },
                  m3u8: {
                    bucket: env.S3_VIDEO_BUCKET,
                    key: `transcoded/${job.data.video_id}/${res.streams.hls}`,
                  },
                  audio_channels: res.audio_channels,
                  duration: res.duration,
                  storyboard: {
                    vtt: {
                      bucket: env.S3_VIDEO_BUCKET,
                      key: `transcoded/${job.data.video_id}/${res.streams.storyboard.vtt}`,
                    },
                    image: {
                      bucket: env.S3_VIDEO_BUCKET,
                      key: `transcoded/${job.data.video_id}/${res.streams.storyboard.image}`,
                    },
                  },
                  subtitle_channels: res.subtitle_channels,
                  subtitle: res.streams.subtitle.map(sub => ({
                    label: sub.title,
                    language: sub.language,
                    type: path.extname(sub.output).replace(".", ""),
                    default: sub.default,
                    url: {
                      bucket: env.S3_VIDEO_BUCKET,
                      key: `transcoded/${job.data.video_id}/${sub.output}`,
                      createdAt: new Date(),
                    },
                  })),
                  IndividualAudioTracks: res.streams.audio.map(audio => ({
                    label: audio.title,
                    bitrate: audio.bitrates,
                    codec: audio.codec,
                    channels: audio.channels,
                    duration: res.duration,
                    language: audio.language,
                    url: {
                      bucket: env.S3_VIDEO_BUCKET,
                      key: `transcoded/${job.data.video_id}/${audio.output}`,
                    },
                  })),
                  IndividualVideoTracks: res.streams.video.map(video => ({
                    bitrate: video.bitrate,
                    codec: video.codec,
                    duration: res.duration,
                    hight: video.height,
                    width: video.width,
                    url: {
                      bucket: env.S3_VIDEO_BUCKET,
                      key: `transcoded/${job.data.video_id}/${video.output}`,
                    },
                  })),
                },
              });
              const newVid = await prisma.video.update({
                where: {
                  id: job.data.video_id,
                },
                data: {
                  is_ready: true,
                },
                select: {
                  is_published: true,
                  id: true,
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
              }
              console.log("updateing video done", job.data.video_id);
            } catch (error) {
              logger.error(
                "saving transcoded files to database failed",
                { video_id: job.data.video_id },
                error,
              );
              console.log("error", error);
              reject();
              return;
            }
          } catch (error) {
            logger.error(
              "uploading hls files failed",
              {
                video_id: job.data.video_id,
              },
              error,
            );
            reject();
            return;
          }
          resolve();
        } catch (error) {
          logger.error("transcoding failed", error);
          console.error(
            "transcoding failed",
            {
              video_id: job.data.video_id,
            },
            error,
          );
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      logger.error("downloading file failed", error);
      throw new Error("downloading file failed");
    }
  },
  {
    connection: redis,
    prefix: "queue",
    concurrency: 1,
    autorun: false,
  },
);

worker.on("failed", async (job, error) => {
  console.log('worker.on("failed', error);

  if (!job) {
    return;
  }
  try {
    await prisma.videoTranscoding.update({
      where: {
        video_id: job.data.video_id,
      },
      data: {
        status: "failed",
        message: error.message,
      },
    });
  } catch (error) {}
});

worker.on("completed", async job => {
  try {
    await prisma.videoTranscoding.update({
      where: {
        video_id: job.data.video_id,
      },
      data: {
        status: "completed",
      },
    });
  } catch (error) {}
});
