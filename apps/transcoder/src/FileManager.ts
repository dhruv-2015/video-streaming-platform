import { customS3Uploader } from "@workspace/aws";
import { env } from "@workspace/env";
import fs from "fs";
import path from "path";

export class Filamanager {
  constructor() {}
  static async uploadHlsFiles(dir: string) {
    const files = fs
      .readdirSync(dir, { recursive: true })
      .map(file => path.join(dir, file.toString()))
      .filter(file => !fs.statSync(file).isDirectory());

    // Create a queue to process files with max 12 concurrent uploads
    const queue = files.slice();
    const inProgress = new Set();
    const maxConcurrent = 12;

    while (queue.length > 0 || inProgress.size > 0) {
      // Start new uploads if under concurrent limit
      while (queue.length > 0 && inProgress.size < maxConcurrent) {
        const file = queue.shift()!;
        inProgress.add(file);

        customS3Uploader
          .uploadStream(
            env.S3_VIDEO_BUCKET,
            file.replace(/\\/g, "/"),
            fs.createReadStream(file),
          )
          .then(() => {
            inProgress.delete(file);
          })
          .catch(error => {
            inProgress.delete(file);
            throw error;
          });
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}


Filamanager.uploadHlsFiles