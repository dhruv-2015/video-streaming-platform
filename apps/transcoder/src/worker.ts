import { prisma, redis } from "@workspace/database";
import { Job, Worker, Queue } from "bullmq";
import { VideoTranscoder } from "./transcoder";
import { Filamanager } from "./FileManager";
import path from "path";
import logger from "./logger";
import { env } from "@workspace/env";
import { recomandationSystem } from "@workspace/services";
import fs from "fs";

/**
 * Interface for job data passed to the worker
 */
interface MyData {
  file: {
    key: string;
    bucket: string;
  };
  video_id: string;
  _lockExtender?: NodeJS.Timeout;
}

Filamanager.createDirectory("./tmp");

// Maps to track active jobs and their transcoders
const activeTranscoders = new Map<string, VideoTranscoder>();
const activeJobs = new Map<string, Job>();

/**
 * Cleanup function to handle graceful shutdown
 * Cleans up active transcoders and updates job statuses
 */
async function cleanup() {
  logger.info('Starting cleanup process', { 
    activeTranscoders: activeTranscoders.size,
    activeJobs: activeJobs.size 
  });

  // Cleanup all active transcoders
  for (const [jobId, transcoder] of activeTranscoders) {
    try {
      await transcoder.cleanup();
      activeTranscoders.delete(jobId);
      logger.info('Cleaned up transcoder', { jobId });
    } catch (error) {
      logger.error("Failed to cleanup transcoder", { 
        jobId, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Update status for all active jobs
  for (const [jobId, job] of activeJobs) {
    try {
      await prisma.videoTranscoding.update({
        where: { video_id: job.data.video_id },
        data: { 
          status: "failed",
          message: "Process terminated during shutdown" 
        }
      });
      activeJobs.delete(jobId);
      logger.info('Updated job status during cleanup', { jobId });
    } catch (error) {
      logger.error("Failed to update job status during cleanup", { 
        jobId,
        videoId: job.data.video_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Handle termination signals for graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal - initiating graceful shutdown');
  await cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal - initiating graceful shutdown');
  await cleanup();
  process.exit(0);
});

const _lockExtender = new Map<string, NodeJS.Timeout>();

// Create the worker instance
export const worker = new Worker<MyData>(
  "video_transcoder",
  async (job: Job) => {
    // Validate job
    if (!job.id) {
      logger.warn('Received job without ID - skipping');
      return;
    }

    // Track this job
    activeJobs.set(job.id, job);
    const abortController = new AbortController();
    
    try {
      logger.info('Starting video transcoding job', {
        jobId: job.id,
        videoId: job.data.video_id
      });

      // Initialize transcoder
      const transcoder = new VideoTranscoder(
        true,
        "ffmpeg",
        "D:\\bin\\packager.exe",
        6,
        0,
        job.id
      );
      activeTranscoders.set(job.id, transcoder);

      // Setup file paths
      const orignalFile = `./tmp/${job.data.video_id}${path.extname(job.data.file.key)}`;
      const outputDir = `./tmp/transcoded/${job.data.video_id}`;

      // Create output directory
      await Filamanager.createDirectory(outputDir);
      logger.debug('Created output directory', { outputDir });

      // Download source file
      logger.info('Downloading source file', { 
        bucket: job.data.file.bucket,
        key: job.data.file.key 
      });
      await Filamanager.downloadFile(
        job.data.file.bucket,
        job.data.file.key,
        orignalFile,
      );

      // Start transcoding
      const result = await transcoder.transcode(orignalFile, outputDir, {
        abortController,
        onFfmpegCommandGenerate(data) {
          logger.info("Generated FFmpeg commands", { 
            jobId: job.id,
            videoId: job.data.video_id,
            commandCount: data.ffmpegCommandsArgs.length
          });
        },
        onFfmpegError(data) {
          logger.error("FFmpeg error", { 
            jobId: job.id,
            videoId: job.data.video_id,
            part: data.part,
            error: data.error.message
          });
        },
        onEnd() {
          logger.info("Transcoding process completed", { 
            jobId: job.id,
            videoId: job.data.video_id
          });
        }
      });

      // Upload transcoded files
      logger.info('Uploading transcoded files', {
        jobId: job.id,
        videoId: job.data.video_id
      });
      await Filamanager.uploadHlsFiles(
        outputDir,
        `transcoded/${job.data.video_id}`,
      );

      // Update database with transcoding results
      logger.info('Updating database with transcoding results', {
        jobId: job.id,
        videoId: job.data.video_id
      });
      
      await prisma.videoFile.create({
        data: {
          Video: { connect: { id: job.data.video_id } },
          m3u8: {
            bucket: env.S3_VIDEO_BUCKET,
            key: `transcoded/${job.data.video_id}/${result.streams.hls}`,
          },
          audio_channels: result.audio_channels,
          duration: result.duration,
          storyboard: {
            vtt: {
              bucket: env.S3_VIDEO_BUCKET,
              key: `transcoded/${job.data.video_id}/${result.streams.storyboard.vtt}`,
            },
            image: {
              bucket: env.S3_VIDEO_BUCKET,
              key: `transcoded/${job.data.video_id}/${result.streams.storyboard.image}`,
            },
          },
          subtitle_channels: result.subtitle_channels,
          subtitle: result.streams.subtitle.map(sub => ({
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
          IndividualAudioTracks: result.streams.audio.map(audio => ({
            label: audio.title,
            bitrate: audio.bitrates,
            codec: audio.codec,
            channels: audio.channels,
            duration: result.duration,
            language: audio.language,
            url: {
              bucket: env.S3_VIDEO_BUCKET,
              key: `transcoded/${job.data.video_id}/${audio.output}`,
            },
          })),
          IndividualVideoTracks: result.streams.video.map(video => ({
            bitrate: video.bitrate,
            codec: video.codec,
            duration: result.duration,
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

      // Cleanup temporary files
      try {
        fs.rmSync(outputDir, { recursive: true, force: true });
        fs.unlinkSync(orignalFile);
        logger.debug('Cleaned up temporary files', {
          jobId: job.id,
          outputDir,
          orignalFile
        });
      } catch (cleanupError) {
        logger.error("Failed to cleanup temporary files", { 
          jobId: job.id,
          videoId: job.data.video_id,
          error: cleanupError instanceof Error ? cleanupError.message : 'Unknown error'
        });
      }
      
      // Remove from active tracking
      activeTranscoders.delete(job.id);
      activeJobs.delete(job.id);

      logger.info('Job completed successfully', {
        jobId: job.id,
        videoId: job.data.video_id
      });

    } catch (error) {
      logger.error("Job failed", {
        jobId: job.id,
        videoId: job.data.video_id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Cleanup on error
      try {
        const orignalFile = `./tmp/${job.data.video_id}${path.extname(job.data.file.key)}`;
        const outputDir = `./tmp/transcoded/${job.data.video_id}`;
        fs.rmSync(outputDir, { recursive: true, force: true });
        fs.unlinkSync(orignalFile);
      } catch (cleanupError) {
        logger.error("Failed to cleanup files", { error: cleanupError });
      }

      // Remove from active tracking
      activeTranscoders.delete(job.id);
      activeJobs.delete(job.id);

      throw error;
    }
  },
  {
    connection: redis,
    prefix: "queue",
    concurrency: 1,
    autorun: false,
    maxStalledCount: 5,
    skipStalledCheck: true,
    lockDuration: 1000 * 60 * 60 * 3, // 2 hours

  },
);

// // Lock extension logic for long-running jobs
// worker.on('active', async (job) => {
//   if (!job.id) {
//     return;
//   }
//   logger.info('Job activated - setting up lock extension', { 
//     jobId: job.id,
//     videoId: job.data.video_id
//   });

//   try {
//     // Extend lock every 5 minutes
//     const lockExtender = setInterval(async () => {
//       try {
//         // Get token for lock extension
//         const token = job.token;
//         if (!token) {
//           logger.warn('Could not acquire lock for extension', {
//             jobId: job.id,
//             videoId: job.data.video_id
//           });
//           return;
//         }

//         // Extend lock by 30 minutes
//         await job.extendLock(token, 1800000);
//         logger.debug('Lock extended successfully', { 
//           jobId: job.id,
//           videoId: job.data.video_id,
//           duration: '30 minutes'
//         });
//       } catch (error) {
//         logger.error('Failed to extend lock', { 
//           jobId: job.id,
//           videoId: job.data.video_id,
//           error: error instanceof Error ? error.message : 'Unknown error'
//         });
//         clearInterval(lockExtender);
//       }
//     }, 300000);
//     clearInterval(_lockExtender.get(job.id));
//     _lockExtender.set(job.id, lockExtender) ;

//     // Initial lock extension
//     const token = await job.token;
//     if (!token) {
//       logger.warn('Could not acquire lock for initial extension', {
//         jobId: job.id,
//         videoId: job.data.video_id
//       });
//       return;
//     }
//     await job.extendLock(token, 1800000);
//     logger.info('Initial lock extension completed', {
//       jobId: job.id,
//       videoId: job.data.video_id
//     });
//   } catch (error) {
//     logger.error('Failed to setup lock extension', { 
//       jobId: job.id,
//       videoId: job.data.video_id,
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// });

// Clean up lock extender when job completes or fails
worker.on('completed', async (job) => {
  job.id && _lockExtender.get(job.id) && clearInterval(_lockExtender.get(job.id)) && _lockExtender.delete(job.id) ;
  try {
    await prisma.videoTranscoding.update({
      where: {
        video_id: job.data.video_id,
      },
      data: {
        status: "completed",
      },
    });
  } catch (error) {
    logger.error('Failed to update completion status', { jobId: job.id, error });
  }
});

worker.on('failed', async (job, error) => {
  job && job.id && _lockExtender.get(job.id) && clearInterval(_lockExtender.get(job.id)) && _lockExtender.delete(job.id) ;
  
  logger.error("Job failed", {
    videoId: job?.data.video_id,
    error: error instanceof Error ? error.message : 'Unknown error'
  });

  if (!job) return;

  try {
    await prisma.videoTranscoding.update({
      where: { video_id: job.data.video_id },
      data: {
        status: "failed",
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  } catch (dbError) {
    logger.error("Failed to update video status", { error: dbError });
  }
});

// Handle stalled jobs
worker.on('stalled', async (jobId) => {
  _lockExtender.get(jobId) && clearInterval(_lockExtender.get(jobId)) && _lockExtender.delete(jobId) ;
  logger.warn('Job stalled', { jobId });
  try {
    // Get the queue instance
    const queue = new Queue('video_transcoder', {
      connection: redis
    });
    
    const stalledJob = await Job.fromId(queue, jobId);
    if (stalledJob) {
      await prisma.videoTranscoding.update({
        where: { video_id: stalledJob.data.video_id },
        data: {
          status: "failed",
          message: "Job stalled - processing took too long"
        }
      });
      logger.info('Updated stalled job status: Job stalled - processing took too long' + jobId, {
        jobId,
        videoId: stalledJob.data.video_id
      });
    }
  } catch (error) {
    logger.error('Failed to handle stalled job', { 
      jobId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
