import { customS3Uploader } from "@workspace/aws";
import { env } from "@workspace/env";
import fs from "fs";
import path from "path";
import logger from "./logger";

export class Filamanager {
  constructor() {}
  static async uploadHlsFiles(dir: string, baseKey: string) {
    // console.log("start uploading hls files", dir, baseKey);
    // try {
    //   fs
    // .readdirSync(dir, { recursive: true })
    // .map(file => file.toString())
    // .filter(file => !fs.statSync(path.join(dir,file)).isDirectory());
    // console.log("got total", files.length, "files");
    // } catch (error) {
    //   console.log("errortgfdsvgbrhtgfvc", error);
      
    // }
    const files = fs
    .readdirSync(dir, { recursive: true })
    .map(file => path.join(dir,file.toString()))
    .filter(file => !fs.statSync(file).isDirectory());
    // console.log("got total", files.length, "files");
    
    // Create a queue to process files with max 12 concurrent uploads
    const queue = files.slice();
    const inProgress = new Set();
    const maxConcurrent = 12;
    // console.log("maxConcurrent", maxConcurrent);
    

    while (queue.length > 0 || inProgress.size > 0) {
      // Start new uploads if under concurrent limit
      while (queue.length > 0 && inProgress.size < maxConcurrent) {
        const file = queue.shift()!;
        inProgress.add(file);
        // console.log("uploading -> ", file);
        
        customS3Uploader
          .uploadStream(
            env.S3_VIDEO_BUCKET,
            `${baseKey}/${path.relative(dir, file).replace(/\\/g, "/")}`,
            fs.createReadStream(file),
          )
          .then(() => {
            inProgress.delete(file);
          })
          .catch(error => {
            inProgress.delete(file);
            console.error(file, error);
            
            throw error;
          });
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  static createDirectory(directory: string) {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  }

  static downloadFile(bucket: string, key: string, destination: string) {
    return new Promise<void>(async (resolve, reject) => {
      this.createDirectory(path.dirname(destination))
      const stream = await customS3Uploader.downloadStream(bucket, key);
      stream.pipe(fs.createWriteStream(destination));
      stream.on("end", () => {
        resolve();
      });
      stream.on("error", error => {
        logger.error("downloadFile", bucket, key, destination, error);
        reject(error);
      });
    });
  }
}
