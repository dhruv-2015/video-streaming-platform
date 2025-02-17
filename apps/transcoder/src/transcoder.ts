import { exec, execSync, spawn } from "child_process";
import path from "path";
import fs from "fs";
import logger from "./logger";
import { redis } from "@workspace/database";
import { customS3Uploader } from "@workspace/aws";
import { env } from "@workspace/env";

interface FFmpegProgress {
  percent: number;
  timemark: string;
  currentTime: number;
  duration: number;
  fps?: number;
  size?: number;
}

interface FFmpegEvents {
  onStart?: (command: string) => void;
  onProgress?: (progress: FFmpegProgress) => void;
  onEnd?: (skipUpload?: boolean) => void;
  onError?: (error: Error) => void;
  abortController?: AbortController;
  cacheId?: string;
  totalStreams?: number;
}

interface Resolution {
  name: string;
  width: number;
  level: number;
  profile: string;
  height: number;
  bitrate: number;
}

interface ResolutionSpec {
  width: number;
  height: number;
  level: number;
  profile: string;
}

interface VideoMetadata {
  streams: Stream[];
  format: {
    bit_rate: string;
    duration: string;
    filename: string;
    format_name: string;
    format_long_name: string;
    size: string;
  };
}

interface Stream {
  codec_type: string;
  width?: number;
  height?: number;
  channels?: number;
  r_frame_rate?: string;
  codec_name?: string;
  tags?: {
    language?: string;
    title?: string;
  };
}

interface CalculatedResolution {
  width: number;
  height: number;
  baseOnHeight: boolean;
}

interface SubtitleCodecInfo {
  codec: string;
  outputFormat: string;
}

interface FinalMetadata {
  video: {
    index: number;
    part: number;
    fps: number;
    output: string;
    bitrate: number;
    name: string;
    width: number;
    profile: string;
    height: number;
    level: number;
  }[];
  audio: {
    index: number;
    part: number;
    default: boolean;
    output: string;
    channels: number;
    bitrates: number;
    language: string;
    title: string;
    codec: string;
  }[];
  subtitle: {
    index: number;
    part: number;
    default: boolean;
    output: string;
    language: string;
    title: string;
    codec: string;
  }[];
}

const OPTIMAL_BITRATES: Record<string, number> = {
  "144p": 150,
  "240p": 400,
  "360p": 800,
  "480p": 1400,
  "720p": 2800,
  "1080p": 5000,
  "1440p": 8000,
};

const RESOLUTIONS: Record<string, ResolutionSpec> = {
  "144p": { width: 256, height: 144, level: 3.0, profile: "baseline" },
  "240p": { width: 426, height: 240, level: 3.0, profile: "baseline" },
  "360p": { width: 640, height: 360, level: 3.0, profile: "baseline" },
  "480p": { width: 854, height: 480, level: 3.1, profile: "main" },
  "720p": { width: 1280, height: 720, level: 4.0, profile: "main" },
  "1080p": { width: 1920, height: 1080, level: 4.2, profile: "high" },
  "1440p": { width: 2560, height: 1440, level: 5.0, profile: "high" },
};

const SEGMENT_DURATION = 10; // Duration of each segment in seconds
const MAX_SEGMENTS_PER_PLAYLIST = 0; // 0 means include all segments for VOD

class FfmpegWrapper {
  // private ffmpegPath: string;

  constructor(
    private ffmpegPath: string,
    private packagerPath: string,
  ) {
    // this.ffmpegPath = ffmpegPath;
  }

  /**
   * Execute FFmpeg command with progress monitoring
   * @param options - FFmpeg command options
   * @param events - Event callbacks for monitoring progress
   * @returns Promise that resolves when processing is complete
   */
  public async execute(
    options: string[],
    events: FFmpegEvents = {},
  ): Promise<void> {
    const { onStart, onProgress, onEnd, onError, abortController, cacheId } =
      events;
    // if (cacheId) {
    //   const cacheKey = `ffmpeg:${events.cacheId}`;
    //   const cachedResult = await redis.get(cacheKey);
    //   if (cachedResult) {
    //     const res = JSON.parse(cachedResult) as string[];
    //     if (res.length === events.totalStreams) {
    //       const catchResult = await Promise.all(
    //         res.map(fileKey => {
    //           return customS3Uploader.checkFileExists({
    //             key: fileKey,
    //             bucket: env.S3_VIDEO_BUCKET,
    //           });
    //         }),
    //       );
    //       if (catchResult.filter(r => r === true).length === res.length) {
    //         await Promise.all(
    //           res.map(file => {
    //             return new Promise((resolve, reject) => {
    //               fs.mkdirSync(path.dirname(file), { recursive: true });
    //               customS3Uploader
    //                 .downloadStream(env.S3_VIDEO_BUCKET, file)
    //                 .then(downloadStream => {
    //                   downloadStream
    //                     .pipe(fs.createWriteStream(file))
    //                     .on("finish", () => {
    //                       console.log("Downloaded file successfully");
    //                       resolve(0);
    //                     })
    //                     .on("error", error => {
    //                       reject(error);
    //                     });
    //                 });
    //             });
    //           }),
    //         );
    //         if (onEnd) onEnd(true);
    //         return;
    //       }
    //     }
    //     // await redis.del(cacheKey);
    //   } else {
    //     console.log("No cache found", cachedResult, cacheKey);
    //   }
    // }
    return new Promise((resolve, reject) => {
      // Add progress arguments if onProgress callback is provided
      const progressArgs: string[] = onProgress ? ["-progress", "pipe:2"] : [];
      const args: string[] = [...progressArgs, ...options];

      // Spawn FFmpeg process
      //   const process = spawn(this.ffmpegPath, args,  { captureStdout: true, niceness: 0, cwd: undefined, windowsHide: true, });
      const process = spawn(this.ffmpegPath, args, {
        windowsHide: true,
        signal: abortController?.signal,
      });
      let duration = 0;
      //   abortController?.signal.addEventListener("abort", () => {

      //   })
      // Handle process start
      if (onStart) {
        onStart(`${this.ffmpegPath} ${args.join(" ")}`);
      }
      if (process.stderr) {
        process.stderr.setEncoding("utf8");
      }

      process.on("error", function (error) {
        if (onError) onError(error);
        reject(error);
      });

      // Handle stderr (includes progress information)
      process.stderr.on("data", (data: string) => {
        // console.log(data);

        // Extract duration if not already found
        if (!duration) {
          const durationMatch = data.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
          if (durationMatch) {
            const [, hours, minutes, seconds] = durationMatch;
            duration =
              (parseInt(hours ?? "0") * 3600 +
                parseInt(minutes ?? "0") * 60 +
                parseInt(seconds ?? "0")) *
              1000;
          }
        }

        // Parse progress information
        if (onProgress && data.includes("time=")) {
          const timeMatch = data.match(/time=(\d{2}):(\d{2}):(\d{2})/);
          if (timeMatch) {
            const [, hours, minutes, seconds] = timeMatch;
            const currentTime =
              (parseInt(hours ?? "0") * 3600 +
                parseInt(minutes ?? "0") * 60 +
                parseInt(seconds ?? "0")) *
              1000;

            const progress: FFmpegProgress = {
              percent: duration
                ? Math.round((currentTime / duration) * 100)
                : 0,
              timemark: `${hours}:${minutes}:${seconds}`,
              currentTime,
              duration,
            };

            // Extract other useful information
            const fpsMatch = data.match(/fps=\s*(\d+)/);
            if (fpsMatch) {
              progress.fps = parseInt(fpsMatch[1] ?? "0");
            }

            const sizeMatch = data.match(/size=\s*(\d+)kB/);
            if (sizeMatch) {
              progress.size = parseInt(sizeMatch[1] ?? "0");
            }

            onProgress(progress);
          }
        }
      });

      // Handle process completion
      process.on("exit", (code: number | null) => {
        if (code === 0) {
          if (onEnd) onEnd();
          resolve();
        } else {
          const error = new Error(`FFmpeg process exited with code ${code}`);
          if (onError) onError(error);
          reject(error);
        }
      });

      // Handle process errors
      process.on("error", (error: Error) => {
        if (onError) onError(error);
        reject(error);
      });
    });
  }

  public async pakage(options: string[], events: FFmpegEvents = {}) {
    const { onStart, onEnd, onError, abortController } = events;
    return new Promise<void>((resolve, reject) => {
      

      const process = spawn(this.packagerPath, options, {
        windowsHide: true,
        signal: abortController?.signal,
      });

      if (onStart) {
        onStart(`${this.packagerPath} ${options.join(" ")}`);
      }
      if (process.stderr) {
        process.stderr.setEncoding("utf8");
      }

      // Handle process completion
      process.on("exit", (code: number | null) => {
        if (code === 0) {
          if (onEnd) onEnd();
          resolve();
        } else {
          const error = new Error(`FFmpeg process exited with code ${code}`);
          if (onError) onError(error);
          reject(error);
        }
      });

      // Handle process errors
      process.on("error", (error: Error) => {
        if (onError) onError(error);
        reject(error);
      });
    });
  }
}

interface TranscodeOptions {
  onFfmpegCommandGenerate?: (data: {
    ffmpegCommandsArgs: string[][];
    pakagetCommand: string[];
    finalMetadata: FinalMetadata;
  }) => void;
  onFfmpegProgress?: (data: { part: number; progress: FFmpegProgress }) => void;
  onFfmpegEnd?: (data: { part: number }) => void;
  onFfmpegError?: (data: { part: number; error: Error }) => void;
  onFfmpegStart?: (data: {
    part: number;
    args: string[];
    ffmpeg: string;
  }) => void;
  pakagerStart?: () => void;
  pakagerEnd?: () => void;
  pakagerError?: (error: Error) => void;
  onEnd?: () => void;
  abortController?: AbortController;
}

interface TranscodeResult {
  duration: number,
  streams: FinalMetadata & {
    hls: string;
    storyboard: {
      image: string;
      vtt: string;
    }
  }
}

export class VideoTranscoder {
  private ffmpegWrapper: FfmpegWrapper;
  constructor(
    private GPU: boolean,
    private ffmpeg: string = "ffmpeg",
    private packager: string = "packager",
    private SEGMENT_DURATION = 6,
    private MAX_SEGMENTS_PER_PLAYLIST = 0, // 0 means include all segments for VOD set somthing for live videos
  ) {
    this.ffmpegWrapper = new FfmpegWrapper(ffmpeg, packager);
  }

  private getFPS(videoStream: Stream): number {
    if (!videoStream.r_frame_rate) return 30;

    const [num, den] = videoStream.r_frame_rate.split("/").map(Number) ?? [
      24, 1,
    ];
    return Math.round((num ?? 24) / (den ?? 1));
  }

  private createDir(path: string) {
    try {
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
      }
    } catch (error) {
      console.error("Error creating directory:", error);
    }
  }

  private findBestResolution(
    originalWidth: number,
    originalHeight: number,
    tolerance: number = 0.05,
  ): { resolution: string; spec: ResolutionSpec } {
    // Sort resolutions from highest to lowest
    const sortedResolutions = Object.entries(RESOLUTIONS).sort(
      (a, b) => b[1].height - a[1].height,
    );

    // Find the first resolution that's smaller than or equal to the original dimensions
    // (accounting for tolerance)
    const match = sortedResolutions.find(
      ([_, spec]) =>
        originalHeight >= spec.height * (1 - tolerance) ||
        originalWidth >= spec.width * (1 - tolerance),
    );

    // If no match found, return the lowest resolution
    return match
      ? { resolution: match[0], spec: match[1] }
      : { resolution: "144p", spec: RESOLUTIONS["144p"]! };
  }
  private calculateNewResolution(
    originalWidth: number,
    originalHeight: number,
    targetRes: ResolutionSpec,
  ): CalculatedResolution {
    const aspectRatio = originalWidth / originalHeight;
    const heightRatio = originalHeight / targetRes.height;
    const widthRatio = originalWidth / targetRes.width;
    const baseOnHeight = heightRatio >= widthRatio;

    let newWidth: number;
    let newHeight: number;

    if (baseOnHeight) {
      newHeight = Math.min(targetRes.height, originalHeight);
      newWidth = Math.floor((newHeight * aspectRatio) / 2) * 2;

      if (newWidth > originalWidth) {
        newWidth = originalWidth;
        newHeight = Math.floor(newWidth / aspectRatio / 2) * 2;
      }
    } else {
      newWidth = Math.min(targetRes.width, originalWidth);
      newHeight = Math.floor(newWidth / aspectRatio / 2) * 2;

      if (newHeight > originalHeight) {
        newHeight = originalHeight;
        newWidth = Math.floor((newHeight * aspectRatio) / 2) * 2;
      }
    }

    return {
      width: newWidth,
      height: newHeight,
      baseOnHeight,
    };
  }

  private calculateBitrate(
    originalBitrate: number,
    originalWidth: number,
    originalHeight: number,
    targetWidth: number,
    targetHeight: number,
  ): number {
    const pixelRatio =
      (targetWidth * targetHeight) / (originalWidth * originalHeight);
    const bitrate = Math.round(originalBitrate * pixelRatio * 0.9);
    return bitrate;
  }

  private calculateResolutions(metadata: VideoMetadata): Resolution[] {
    const videoStream = metadata.streams.find(s => s.codec_type === "video");
    if (!videoStream || !videoStream.width || !videoStream.height) {
      throw new Error("No valid video stream found");
    }

    const originalWidth = videoStream.width;
    const originalHeight = videoStream.height;
    const originalBitrate = parseInt(metadata.format.bit_rate) / 1000; // Convert to kbps

    // Find best matching resolution with 5% tolerance
    const { resolution: bestRes } = this.findBestResolution(
      originalWidth,
      originalHeight,
      0.05,
    );
    const availableResolutions: Resolution[] = [];

    Object.entries(RESOLUTIONS).forEach(([res, targetSpec]) => {
      if (!(parseInt(res) <= parseInt(bestRes))) {
        return;
      }
      //   logger.info(`bestRes: ${bestRes}, res: ${res}`);

      const calculatedRes = this.calculateNewResolution(
        originalWidth,
        originalHeight,
        targetSpec,
      );

      const calculatedBitrate = this.calculateBitrate(
        originalBitrate,
        originalWidth,
        originalHeight,
        calculatedRes.width,
        calculatedRes.height,
      );

      availableResolutions.push({
        name: res,
        width: calculatedRes.width,
        height: calculatedRes.height,
        level: targetSpec.level,
        profile: targetSpec.profile,
        bitrate: Math.min(calculatedBitrate, OPTIMAL_BITRATES[res]!),
      });
    });

    return availableResolutions;
  }

  private getSubtitleCodecInfo(stream: Stream): SubtitleCodecInfo {
    const subtitleFormat = stream.codec_name?.toLowerCase() || "";

    if (["subrip", "srt"].includes(subtitleFormat)) {
      return { codec: "webvtt", outputFormat: "vtt" };
      // return { codec: "srt", outputFormat: "srt" };
    } else if (["ass", "ssa"].includes(subtitleFormat)) {
      return { codec: "ass", outputFormat: "ass" };
    } else if (["webvtt", "vtt"].includes(subtitleFormat)) {
      return { codec: "webvtt", outputFormat: "vtt" };
    } else {
      // For other formats, attempt to convert to SRT
      return { codec: "webvtt", outputFormat: "vtt" };
      // return { codec: "srt", outputFormat: "srt" };
    }
  }

  private generateStorybordFormatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const ms = Math.floor((secs % 1) * 1000);

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}:${String(Math.floor(secs)).padStart(2, "0")}.${String(ms).padStart(
      3,
      "0",
    )}`;
  }

  private generateVTTContentForStoryBord(
    totalFrames: number,
    tilesPerColumn: number,
    frameWidth: number,
    frameHeight: number,
    interval: number,
  ): string {
    let vttContent = "WEBVTT\n\n";
    const tilesPerRow = 10; // Fixed number of tiles per row

    for (let i = 0; i < totalFrames; i++) {
      const startTime = i * interval;
      const endTime = (i + 1) * interval;

      const x = (i % tilesPerRow) * frameWidth;
      const y = Math.floor(i / tilesPerRow) * frameHeight;

      vttContent += `${this.generateStorybordFormatTime(startTime)} --> ${this.generateStorybordFormatTime(endTime)}\n`;
      vttContent += `storyboard.jpg#xywh=${x},${y},${frameWidth},${frameHeight}\n\n`;
    }

    return vttContent;
  }

  private generateFfmpegCommands(
    inputFile: string,
    outputDir: string,
    metadata: VideoMetadata,
  ): {
    ffmpegCommandsArgs: string[][];
    pakagetCommand: string[];
    finalMetadata: FinalMetadata;
  } {
    logger.debug(
      "generateFfmpegCommands metadata",
      JSON.stringify(metadata, null, 2),
    );
    const videoStream = metadata.streams.find(s => s.codec_type === "video");
    if (!videoStream) throw new Error("No video stream found");
    const originalFPS = this.getFPS(videoStream);
    logger.debug("generateFfmpegCommands originalFPS", originalFPS);

    const resolutions = this.calculateResolutions(metadata);
    logger.debug(
      "generateFfmpegCommands resolutions.length",
      resolutions.length,
    );

    const audioStreams = metadata.streams.filter(s => s.codec_type === "audio");
    logger.debug(
      "generateFfmpegCommands audioStreams.length",
      audioStreams.length,
    );
    const subtitleStreams = metadata.streams.filter(
      s => s.codec_type === "subtitle",
    );
    logger.debug(
      "generateFfmpegCommands subtitleStreams.length",
      subtitleStreams.length,
    );
    const baseIDRInterval = Math.round(originalFPS * 3);
    logger.debug(
      "generateFfmpegCommands baseIDRInterval {fps * 3}",
      baseIDRInterval,
    );

    // metadata
    const totalParts = this.GPU ? Math.floor(resolutions.length / 3) : 1;
    const filterComplex: string[][] = [];
    const ffmpegCommandArgs: string[][] = Array.from({
      length: totalParts,
    }).map(_ => []);
    const pakagetCommandArgs: string[] = [];

    const finalMetadata: FinalMetadata = {
      video: [],
      audio: [],
      subtitle: [],
    };

    if (!this.GPU) {
      logger.info("GPU is not enabled");
      filterComplex.push([
        `[0:v]split=${resolutions.length}${Array.from(
          { length: resolutions.length },
          (_, i) => `[v${i}]`,
        ).join("")}`,
      ]);
    } else {
      logger.info("GPU is enabled");
      filterComplex.push(
        ...Array.from({ length: totalParts }).map((_, i) => {
          const start = i * 3;
          const end = Math.min(start + 3, resolutions.length);
          return [
            `[0:v]split=3${Array.from(
              { length: end - start },
              (_, j) => `[v${start + j}]`,
            ).join("")}`,
          ];
        }),
      );
    }
    const basePath = path.join(outputDir, "hls");

    resolutions.forEach((res, index) => {
      const part = this.GPU ? Math.floor(index / 3) : 0;
      const targetFPS =
        originalFPS >= 60 && res.height >= 720
          ? 60
          : originalFPS < 30
            ? originalFPS
            : 30;

      if (!filterComplex[this.GPU ? part : 0]) {
        filterComplex[this.GPU ? part : 0] = [];
      }

      filterComplex[this.GPU ? part : 0]!.push(
        `[v${index}]scale=${res.width}:${res.height}${
          targetFPS !== originalFPS ? `,fps=${targetFPS}` : ""
        }[v${index}out]`,
      );

      const variantPath = path.join(outputDir, `${res.name}.mp4`);

      ffmpegCommandArgs[part]!.push(
        "-map",
        `[v${index}out]`,
        "-c:v",
        `${this.GPU ? "h264_nvenc" : "libx264"}`,
        "-profile:v",
        res.profile,
        "-level:v",
        `${res.level}`,
        "-preset",
        "medium",

        "-g",
        `${baseIDRInterval}`,
        "-keyint_min",
        `${baseIDRInterval}`,
        "-force_key_frames",
        `expr:gte(t,n_forced*${baseIDRInterval})`,

        "-b_ref_mode",
        "0",
        "-bf",
        "0",
        "-b:v",
        `${res.bitrate}k`,
        "-minrate",
        `${res.bitrate}K`,
        "-maxrate",
        `${res.bitrate}k`,
        "-bufsize",
        `${res.bitrate}k`,
        "-movflags",
        "+faststart+negative_cts_offsets",
        "-video_track_timescale",
        "90000",
        `${variantPath}`,
      );

      pakagetCommandArgs.push(
        `in=${variantPath},stream=video,segment_template=${path.join(
          basePath,
          `video_${res.name}_$Number$.ts`,
        )},playlist_name=${path.join(
          basePath,
          `video_${res.name}.m3u8`,
        )},iframe_playlist_name=${path.join(
          basePath,
          `video_${res.name}_iframe.m3u8`,
        )}`,
      );

      finalMetadata.video.push({
        index: index,
        part: part,
        fps: targetFPS,
        output: variantPath,
        bitrate: res.bitrate,
        name: res.name,
        width: res.width,
        profile: res.profile,
        height: res.height,
        level: res.level,
      });
    });

    audioStreams.map((stream, index) => {
      const part = totalParts;
      if (ffmpegCommandArgs.length <= totalParts) {
        ffmpegCommandArgs.push([]);
      }
      const language = stream.tags?.language || "und";
      const title = stream.tags?.title || `Audio_Track_${index + 1}`;
      const channels = stream.channels ?? 2;
      filterComplex[totalParts];

      ffmpegCommandArgs[totalParts];

      if (channels <= 2) {
        const audioPath = path.join(
          outputDir,
          `audio_${language}_ch_${channels}.mp4`,
        );
        ffmpegCommandArgs[totalParts]!.push(
          "-map",
          `0:a:${index}`,
          "-c:a",
          "aac",
          "-b:a",
          "160k",
          `${audioPath}`,
        );
        pakagetCommandArgs.push(
          `in=${audioPath},stream=audio,segment_template=${path.join(
            basePath,
            `audio_${language}_ch_${channels}_$Number$.ts`,
          )},playlist_name=${path.join(
            basePath,
            `audio_ch_${channels}_${language}.m3u8`,
          )},hls_group_id=audio,hls_name=${title},language=${language}`,
        );
        finalMetadata.audio.push({
          part,
          index: index,
          default: index === 0,
          output: audioPath,
          channels: channels,
          bitrates: 160,
          language,
          title,
          codec: "aac",
        });
        return;
      }
      // For 5.1 surround (6 channels)
      // Channel layout: FL+FR+FC+LFE+BL+BR (c0=FL, c1=FR, c2=FC, c3=LFE, c4=BL, c5=BR)
      // if (filterComplex.length <= totalParts) {
      //   filterComplex.push([]);
      // }
      // filterComplex[totalParts].push(
      //   `[0:a:${index}]split=2[a${index}d1][a${index}d2]`
      // );
      if (channels === 6) {
        // audio with 6 channels
        const audioPath1 = path.join(
          outputDir,
          `audio_${language}_ch_${channels}.mp4`,
        );
        ffmpegCommandArgs[totalParts]!.push(
          "-map",
          `0:a:${index}`,
          "-c:a",
          "aac",
          "-b:a",
          "320k",
          `${audioPath1}`,
        );
        // pakagetCommandArgs.push(
        //   `in=${audioPath1},stream=audio,segment_template=${path.join(
        //     basePath,
        //     `audio_${language}_ch_${channels}_$Number$.ts`
        //   )},playlist_name=${path.join(
        //     basePath,
        //     `audio_${language}_ch_${channels}.m3u8`
        //   )},hls_group_id=audio,hls_name=${title},language=${language}`
        // );
        finalMetadata.audio.push({
          part,
          index: index,
          default: index == 0,
          output: audioPath1,
          channels: channels,
          bitrates: 320,
          language,
          title,
          codec: "aac",
        });

        // stereo audio
        const audioPath2 = path.join(outputDir, `audio_${language}_ch_2.mp4`);
        ffmpegCommandArgs[totalParts]!.push(
          "-map",
          `0:a:${index}`,
          "-c:a",
          "aac",
          "-b:a",
          "160k",
          "-af",
          `pan=stereo|c0=0.5*c2+0.707*c0+0.707*c4+0.5*c3|c1=0.5*c2+0.707*c1+0.707*c5+0.5*c3`,
          `${audioPath2}`,
        );

        pakagetCommandArgs.push(
          `in=${audioPath2},stream=audio,segment_template=${path.join(
            basePath,
            `audio_${language}_ch_2_$Number$.ts`,
          )},playlist_name=${path.join(
            basePath,
            `audio_${language}_ch_2.m3u8`,
          )},hls_group_id=audio,hls_name=${title},language=${language}`,
        );

        finalMetadata.audio.push({
          part,
          index: index,
          default: index === 0,
          output: audioPath2,
          channels: 2,
          bitrates: 160,
          language,
          title,
          codec: "aac",
        });
        return;
      }

      if (channels === 8) {
        // audio with 8 channels
        const audioPath1 = path.join(
          outputDir,
          `audio_${language}_ch_${channels}.mp4`,
        );
        ffmpegCommandArgs[totalParts]!.push(
          "-map",
          `[0:a:${index}]`,
          "-c:a",
          "aac",
          "-b:a",
          "384k",
          `${audioPath1}`,
        );
        // pakagetCommandArgs.push(
        //   `in=${audioPath1},stream=audio,segment_template=${path.join(
        //     basePath,
        //     `audio_${language}_ch_${channels}_$Number$.ts`
        //   )},playlist_name=${path.join(
        //     basePath,
        //     `audio_${language}_ch_${channels}.m3u8`
        //   )},hls_group_id=audio,hls_name=${title},language=${language}`
        // );
        finalMetadata.audio.push({
          part,
          index: index,
          default: index == 0,
          output: audioPath1,
          channels: channels,
          bitrates: 384,
          language,
          title,
          codec: "aac",
        });

        // audio with 2 channels

        // stereo audio
        const audioPath2 = path.join(outputDir, `audio_${language}_ch_2.mp4`);
        ffmpegCommandArgs[totalParts]!.push(
          "-map",
          `[0:a:${index}]`,
          "-c:a",
          "aac",
          "-b:a",
          "160k",
          "-af",
          `pan=stereo|c0=0.5*c2+0.707*c0+0.5*c4+0.5*c6+0.5*c3|c1=0.5*c2+0.707*c1+0.5*c5+0.5*c7+0.5*c3`,
          `${audioPath2}`,
        );

        pakagetCommandArgs.push(
          `in=${audioPath2},stream=audio,segment_template=${path.join(
            basePath,
            `audio_${language}_ch_2_$Number$.ts`,
          )},playlist_name=${path.join(
            basePath,
            `audio_${language}_ch_2.m3u8`,
          )},hls_group_id=audio,hls_name=${title},language=${language}`,
        );

        finalMetadata.audio.push({
          part,
          index: index,
          default: index === 0,
          output: audioPath2,
          channels: 2,
          bitrates: 160,
          language,
          title,
          codec: "acc",
        });
        return;
      }

      const audioPath1 = path.join(
        outputDir,
        `audio_${language}_ch_${channels}.mp4`,
      );
      ffmpegCommandArgs[totalParts]!.push(
        "-map",
        `[0:a:${index}]`,
        "-c:a",
        "aac",
        `${audioPath1}`,
      );
      // pakagetCommandArgs.push(
      //   `in=${audioPath1},stream=audio,segment_template=${path.join(
      //     basePath,
      //     `audio_${language}_ch_${channels}_$Number$.ts`
      //   )},playlist_name=${path.join(
      //     basePath,
      //     `audio_${language}_ch_${channels}.m3u8`
      //   )},hls_group_id=audio,hls_name=${title},language=${language}`
      // );
      finalMetadata.audio.push({
        part,
        index: index,
        default: index == 0,
        output: audioPath1,
        channels: channels,
        bitrates: -1,
        language,
        title,
        codec: "aac",
      });

      const audioPath2 = path.join(outputDir, `audio_${language}_ch_2.mp4`);
      ffmpegCommandArgs[totalParts]!.push(
        "-map",
        `[0:a:${index}]`,
        "-c:a",
        "aac",
        "-ac",
        "2",
        `${audioPath2}`,
      );

      pakagetCommandArgs.push(
        `in=${audioPath2},stream=audio,segment_template=${path.join(
          basePath,
          `audio_${language}_ch_2_$Number$.ts`,
        )},playlist_name=${path.join(
          basePath,
          `audio_${language}_ch_2.m3u8`,
        )},hls_group_id=audio,hls_name=${title},language=${language}`,
      );

      finalMetadata.audio.push({
        part,
        index: index,
        default: index === 0,
        output: audioPath2,
        channels: 2,
        bitrates: 160,
        language,
        title,
        codec: "acc",
      });
    });

    subtitleStreams.map((stream, index) => {
      const language = stream.tags?.language || "und";
      const title = stream.tags?.title || `Subtitle_Track_${index + 1}`;

      const { codec, outputFormat } = this.getSubtitleCodecInfo(stream);

      const subtitlePath = path.join(
        outputDir,
        `subtitle_${index}_${language}.${outputFormat}`,
      );
      //   `-map 0:s:${index} -c:s ${codec} ` + `"${subtitlePath}" `

      if (ffmpegCommandArgs.length <= totalParts) {
        ffmpegCommandArgs.push([]);
      }
      ffmpegCommandArgs[totalParts]!.push(
        "-map",
        `0:s:${index}`,
        "-c:s",
        codec,
        `${subtitlePath}`,
      );
      finalMetadata.subtitle.push({
        part: totalParts,
        index: index,
        default: index === 0,
        output: subtitlePath,
        language,
        title,
        codec,
      });
    });

    // genVttStoryborde

    const mainFfmpegCommand = [
      "-i",
      `${inputFile}`,
      "-y",
      "-avoid_negative_ts",
      "make_zero",
      "-start_at_zero",
    ];

    const ffmpegCommands = ffmpegCommandArgs.map((args, i) => {
      const cmd = [...mainFfmpegCommand];
      filterComplex[i] &&
        cmd.push("-filter_complex", `${filterComplex[i].join(";")}`);
      return [...cmd, ...args];
    });
    return {
      ffmpegCommandsArgs: ffmpegCommands,
      pakagetCommand: [
        "--transport_stream_timestamp_offset_ms",
        "10000",
        "--segment_duration",
        String(this.SEGMENT_DURATION),
        "--clear_lead",
        "0",
        ...pakagetCommandArgs,
        "--hls_master_playlist_output",
        path.join(outputDir, "master.m3u8"),
      ],
      finalMetadata: {
        audio: finalMetadata.audio.map(audio => ({
          ...audio,
          output: audio.output.replace(/\\/g, "/"),
        })),
        subtitle: finalMetadata.subtitle.map(subtitle => ({
          ...subtitle,
          output: subtitle.output.replace(/\\/g, "/"),
        })),
        video: finalMetadata.video.map(video => ({
          ...video,
          output: video.output.replace(/\\/g, "/"),
        })),
      },
    };
  }

  private async getVideoMetadata(
    inputFile: string,
    option?: { abortController?: AbortController },
  ): Promise<VideoMetadata> {
    const cmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${inputFile}"`;
    return new Promise((resolve, reject) => {
      exec(
        cmd,
        {
          signal: option?.abortController?.signal,
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(JSON.parse(stdout));
        },
      );
    });
    // const output = await
    // return JSON.parse(output);
  }

  // async uploadHlsFiles(dir: string) {
  //   const files = fs
  //     .readdirSync(dir, { recursive: true })
  //     .map(file => path.join(dir, file.toString()))
  //     .filter(file => !fs.statSync(file).isDirectory());

  //   // Create a queue to process files with max 12 concurrent uploads
  //   const queue = files.slice();
  //   const inProgress = new Set();
  //   const maxConcurrent = 12;

  //   while (queue.length > 0 || inProgress.size > 0) {
  //     // Start new uploads if under concurrent limit
  //     while (queue.length > 0 && inProgress.size < maxConcurrent) {
  //       const file = queue.shift()!;
  //       inProgress.add(file);
        
  //       customS3Uploader.uploadStream(
  //         env.S3_VIDEO_BUCKET,
  //         file.replace(/\\/g, "/"),
  //         fs.createReadStream(file)
  //       ).then(() => {
  //         inProgress.delete(file);
  //       }).catch(error => {
  //         inProgress.delete(file);
  //         throw error;
  //       });
  //     }

  //     // Wait a bit before checking again
  //     await new Promise(resolve => setTimeout(resolve, 100));
  //   }
  // }

  generateStoryBord(
    inputFile: string,
    outputDir: string,
    metadata: VideoMetadata,
  ) {
    logger.debug("Getting video metadata...");
    const video = metadata.streams.find(s => s.codec_type == "video");
    if (!video) {
      throw new Error(`video stream not found in input: ${inputFile}`);
    }
    // Calculate dimensions
    const targetWidth = 180;
    const targetHeight = Math.round(
      (targetWidth / video.width!) * video.height!,
    );

    const duration = parseInt(metadata.format.duration);
    // Calculate frames and intervals
    const tmpInt = duration / 1000;

    // const interval = tmpInt < 2 ? 2 : Math.ceil(tmpInt); // 2 seconds between each thumbnail
    // const interval = 3; // 3 seconds between each thumbnail
    const interval = 2; // 2 seconds between each thumbnail
    const totalDuration = duration;
    const totalFrames = Math.floor(totalDuration / interval);

    // Calculate tiles layout
    const tilesPerColumn = Math.ceil(totalFrames / 10); // 10 images per row

    logger.debug("Video information:");
    logger.debug(`Resolution: ${video.width}x${video.height}`);
    logger.debug(`Duration: ${totalDuration} seconds`);
    logger.debug(`Total frames to extract: ${totalFrames}`);
    logger.debug(`Thumbnail size: ${targetWidth}x${targetHeight}`);
    logger.debug(`Grid layout: 10x${tilesPerColumn}`);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate storyboard
    return new Promise<{
      image: string;
      vtt: string;
    }>((resolve, reject) => {
      this.ffmpegWrapper.execute(
        [
          "-i",
          inputFile,
          "-frames",
          "1",
          "-vf",
          // '-f',
          `select=not(mod(n\\,${
            this.getFPS(video) * interval
          })),scale=${targetWidth}:${targetHeight},tile=10x${tilesPerColumn}`,
          path.join(outputDir, "storyboard.jpg"),
        ],
        {
          onStart: command => {
            logger.debug(command);
          },
          onEnd: () => {
            logger.debug("\nStoryboard generated successfully!");

            // Generate VTT file
            const vttContent = this.generateVTTContentForStoryBord(
              totalFrames,
              tilesPerColumn,
              targetWidth,
              targetHeight,
              interval,
            );

            fs.writeFileSync(
              path.join(outputDir, "storyboard.vtt"),
              vttContent,
            );
            console.log("VTT file generated successfully!");
            resolve({
              image: path.join(outputDir, "storyboard.jpg").replace(/\\/g, "/"),
              vtt: path.join(outputDir, "storyboard.vtt").replace(/\\/g, "/"),
            });
          },
          onError(err) {
            console.error("Error generating storyboard:", err);
            reject(err);
          },
          onProgress(progress) {
            console.log(
              `Generating storyboard: ${Math.round(progress.percent ?? 0)}%`,
            );
          },
        },
      );
    });
  }

  async transcode(
    inputFile: string,
    outputDir: string,
    options?: TranscodeOptions,
  ): Promise<TranscodeResult> {
    // Remove output directory if it exists to start fresh
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
    const metadata = await this.getVideoMetadata(inputFile, {
      abortController: options?.abortController,
    });
    const commands = this.generateFfmpegCommands(
      inputFile,
      outputDir,
      metadata,
    );
    this.createDir(outputDir);
    // createDir(path.join(outputDir));
    const allProgress: {
      [key: number]: FFmpegProgress;
    } = {};
    const end: number[] = [];
    const errors: {
      index: number;
      error: Error;
    }[] = [];

    const allStreams = [
      ...commands.finalMetadata.video,
      ...commands.finalMetadata.audio,
      ...commands.finalMetadata.subtitle,
    ];
    const pakagerRes: {
      image: string;
      vtt: string;
    } = {
      image: "",
      vtt: "",
    };
    options?.onFfmpegCommandGenerate?.call(this, commands);
    try {
      await Promise.all(
        commands.ffmpegCommandsArgs.map((args, i) => {
          return this.ffmpegWrapper.execute(args, {
            abortController: options?.abortController,
            cacheId: outputDir + ":" + i,
            onStart: command => {
              logger.info(`Running FFmpeg part: ${i + 1}`);
              options?.onFfmpegStart?.call(this, {
                part: i,
                args: args,
                ffmpeg: this.ffmpeg,
              });
            },
            onProgress: progress => {
              allProgress[i] = progress;
              options?.onFfmpegProgress?.call(this, {
                part: i,
                progress: progress,
              });
            },
            onEnd: async skipUpload => {
              end.push(i);
              logger.info("FFmpeg command completed");
              options?.onFfmpegEnd?.call(this, {
                part: i,
              });
            },
            onError: error => {
              errors.push({
                index: i,
                error: error,
              });
              options?.onFfmpegError?.call(this, {
                part: i,
                error: error,
              });
              logger.error("Error during FFmpeg processing:", error);
            },
          });
        }),
      );

      const [, Res] = await Promise.all([
        this.ffmpegWrapper.pakage(commands.pakagetCommand, {
          abortController: options?.abortController,
          onEnd: () => {
            options?.pakagerEnd?.call(this);
          },
          onError(error) {
            options?.pakagerError?.call(this, error);
          },
          onStart(command) {
            options?.pakagerStart?.call(this);
          },
        }),
        this.generateStoryBord(inputFile, outputDir, metadata),
      ]);

      pakagerRes["image"] = Res.image;
      pakagerRes["vtt"] = Res.vtt;
    } catch (error) {
      logger.error("Error uploading file to s3", error, { path: outputDir });
      throw error;
    }

    options?.onEnd?.call(this);
    return {
      duration: Number(metadata.format.duration),
      streams: {
        ...commands.finalMetadata,
        storyboard: {
          image: pakagerRes.image,
          vtt: pakagerRes.vtt,
        },
        hls: path.join(outputDir, "master.m3u8").replace(/\\/g, "/"),
      },
    };
  }
}


// await this.uploadHlsFiles(path.join(outputDir));
export const videoTranscoder = new VideoTranscoder(
  true,
  "ffmpeg",
  "D:\\bin\\packager.exe",
);

videoTranscoder
  .transcode(
    "D:\\test\\video transcodeing\\out2\\Red-Notice-new.mkv",
    "transcoded/test",
    {
      onFfmpegCommandGenerate(data) {
        //   console.log([
        //     ...data.finalMetadata.subtitle,
        //     ...data.finalMetadata.audio,
        //     ...data.finalMetadata.video,
        //   ]);
      },
      onEnd() {
        // console.log(
        //   "End",
        //   JSON.stringify(
        //     files.map(file => {
        //       return file.parentPath + file.name;
        //     }),
        //   ),
        // );
      },
    },
  )
  .then(data => {
    console.log(JSON.stringify(data));
    
    console.log("done");
    process.exit(0);

  })
  .catch(console.error);
