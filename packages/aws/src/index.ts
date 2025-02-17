// import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  NotFound,
  S3ServiceException,
  GetObjectCommand,
  PutObjectCommandInput,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import mime from "mime";
import loggerDefault, { Logger } from "@workspace/logger";
import { Readable } from "stream";
import * as fs from "fs";
import * as path from "path";
import { env } from "@workspace/env";
import axios from "axios";

const logger: Logger = loggerDefault.child({ service: "@workspace/aws" });

export default logger;

// Interface for custom S3 server configuration
export interface CustomS3Config {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
}

// Interface for pre-signed URL generation options
export interface PresignedUrlOptions {
  bucket: string;
  fileName?: string;
  contentType?: string | null;
  path?: string;
  maxSizeBytes: number;
  expiresIn?: number;
  for: "avatar" | "video" | "temp";
} 

// Interface for pre-signed URL response
export interface PresignedUrlResponse {
  url: string;
  s3Data: {
    key: string;
    maxFileSize: number;
    bucket: string;
    expire: Date;
  };
}

interface CopyObject {
  bucket: string;
  key: string;
}

class CustomS3Uploader {
  private s3Client: S3Client;

  constructor(config: CustomS3Config) {
    this.s3Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      // Force path-style URLs for many self-hosted S3 servers
      forcePathStyle: config.forcePathStyle ?? true,
    });
  }

  async generatePresignedUrl(
    options: PresignedUrlOptions,
  ): Promise<PresignedUrlResponse> {
    // Validate content type
    if (!options.path && !options.fileName) {
      throw new Error("File name or path is required");
    }
    options.contentType =
      mime.getType(options.path ?? (options.fileName as string)) ??
      "application/octet-stream";

    if (options.for === "avatar") {
      options.path =
        options.path ??
        `uploads/avatar/${Date.now()}/${Math.random() * 10000000000000000}/${options.fileName}`;
    }

    if (options.for === "video") {
      options.expiresIn = options.expiresIn ?? 60 * 60 * 24; // 1 day
      options.path =
        options.path ??
        `uploads/video/${Date.now()}/${Math.random() * 10000000000000000}/${options.fileName}`;
    }

    if (options.for === "temp") {
      options.path =
        options.path ??
        `uploads/temp/${Date.now()}/${Math.random() * 10000000000000000}/${options.fileName}`;
    }

    const command = new PutObjectCommand({
      Bucket: options.bucket,
      Key: options.path,
      ContentType: options.contentType,
      ContentLength: options.maxSizeBytes,
    });

    try {
      // Generate pre-signed URL
      const expire = Date.now() + (options.expiresIn ?? 3600);
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: options.expiresIn ?? 3600, // URL expires in 1 hour by default
      });

      return {
        url,
        s3Data: {
          key: options.path!,
          maxFileSize: options.maxSizeBytes!,
          bucket: options.bucket,
          expire: new Date(expire),
        },
      };
    } catch (error) {
      console.error("Error generating pre-signed URL video:", error);
      throw new Error("Failed to generate pre-signed URL");
    }
  }

  async checkFileExists(opt: {
    key: string;
    bucket: string;
  }): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Key: opt.key,
        Bucket: opt.bucket,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error: NotFound | S3ServiceException | any) {
      if (error instanceof NotFound) {
        return false;
      }
      logger.error("@workspace/aws/src/index.ts (checkFileExists)", error);
      throw new Error("Failed to check file existence");
    }
  }

  async uploadStream(
    bucket: string,
    key: string,
    stream: fs.ReadStream,
    progressCallback?: (progress: number) => void,
  ): Promise<void> {
    const parallelUploads3 = new Upload({
      client: this.s3Client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: stream,
        ContentType: mime.getType(key) ?? "application/octet-stream",
      },

      // additional optional fields show default values below:
      // (optional) concurrency configuration
      queueSize: 8,

      // (optional) size of each part, in bytes, at least 5MB
      partSize: 1024 * 1024 * 5,

      // (optional) when true, do not automatically call AbortMultipartUpload when
      // a multipart upload fails to complete. You should then manually handle
      // the leftover parts.
      leavePartsOnError: false,
    });

    parallelUploads3.on("httpUploadProgress", progress => {
      // console.log("progress", progress);
      progress.loaded = progress.loaded ?? 0;
      progress.total = progress.total ?? 0;
      progressCallback?.((progress.loaded * 100) / progress.total);
    });

    try {
      await parallelUploads3.done();
    } catch (error) {
      logger.error("Error uploading file to S3:", error);
      throw new Error("Failed to upload file to S3");
    }
  }

  async downloadStream(bucket: string, key: string): Promise<Readable> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error("No data received from S3");
      }

      // The response.Body is a ReadableStream in browser and Readable in node.js

      return response.Body as Readable;
    } catch (error) {
      logger.error("Error downloading file from S3:", error);
      throw new Error("Failed to download file from S3");
    }
  }

  async copyObject(
    scorce: CopyObject,
    destination: CopyObject,
    abortController?: AbortController,
  ) {
    const checkScorceFile = await this.checkFileExists({
      bucket: scorce.bucket,
      key: scorce.key,
    });
    if (!checkScorceFile) {
      throw new Error("Scorce file not found");
    }
    const command = new CopyObjectCommand({
      Bucket: destination.bucket,
      CopySource: `${scorce.bucket}/${scorce.key}`,
      Key: destination.key,
    });
    try {
      await this.s3Client.send(command, {
        abortSignal: abortController?.signal,
      });
    } catch (error) {
      logger.error("Error copying file from S3:", error);
      throw new Error("Failed to copy file from S3");
    }
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    try {
      const fileExists = await this.checkFileExists({ bucket, key });
      
      if (!fileExists) {
        return;
      }

      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      logger.error("Error deleting file from S3:", error);
      throw new Error("Failed to delete file from S3");
    }
  }

  async uploadProfileImageFromUrl(imageUrl: string): Promise<{
    key: string;
    bucket: string;
    maxFileSize: number;
  }> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });

      const contentType = response.headers["content-type"] ?? "image/jpeg";
      const extension = mime.getExtension(contentType) ?? "jpg";

      const key = `uploads/avatar/${Date.now()}/${Math.random() * 10000000000000000}/profile.${extension}`;

      const arrayBuffer = await response.data;
      const buffer = Buffer.from(arrayBuffer);

      const command = new PutObjectCommand({
        Bucket: env.S3_FILES_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);
      return {
        key: key,
        bucket: env.S3_FILES_BUCKET,
        maxFileSize: buffer.length,
      };
      // s3Data: {
      //   key: key,
      //   maxFileSize: options.maxSizeBytes!,
      //   bucket: options.bucket,
      //   expire: new Date(expire),
      // },
    } catch (error) {
      logger.error("Error uploading profile image from URL:", error);
      throw new Error("Failed to upload profile image from URL");
    }
  }
}

// Example usage with MinIO or other custom S3-compatible server
// async function exampleUsage() {
//   try {
//     // Create an uploader for a custom S3-compatible server (e.g., MinIO)
//     const uploader = new CustomS3ImageUploader({
//       endpoint: 'http://localhost:9000', // MinIO default endpoint
//       region: 'us-east-1', // Can be any region
//       accessKeyId: 'your-access-key',
//       secretAccessKey: 'your-secret-key',
//       forcePathStyle: true // Important for self-hosted S3 servers
//     });

//     // Generate pre-signed URL for a JPEG
//     const jpegPresignedUrl = await uploader.generatePresignedUrl({
//       bucket: 'your-bucket-name',
//       fileName: 'image.jpg',
//     });

//     // Generate pre-signed URL for a PNG
//     const pngPresignedUrl = await uploader.generatePresignedUrl({
//       bucket: 'your-bucket-name',
//       fileName: 'image.jpg',
//     });

//     console.log('JPEG Upload URL:', jpegPresignedUrl);
//     console.log('PNG Upload URL:', pngPresignedUrl);
//   } catch (error) {
//     console.error('Upload URL generation failed:', error);
//   }
// }
const customS3Uploader = new CustomS3Uploader({
  endpoint: env.S3_ENDPOINT ?? "http://localhost:4568",
  region: "auto",
  accessKeyId: "S3RVER",
  secretAccessKey: "S3RVER",
});
export { CustomS3Uploader, customS3Uploader };

// customS3Uploader
//   .checkFileExists({
//     bucket: "test-bucket",
//     key: "uploads/avatar/1738660903833/74580834093107/unnamed.png",
//   })
//   .then(console.log)
//   .catch(console.error);

// Example usage with streams

// Example of uploading a file using streams
// async function exampleStreamUsage() {
//   try {
//     // Upload example
//     const uploadFilePath = path.join(__dirname, "example.txt");
//     const uploadStream = fs.createReadStream(uploadFilePath);
//     await customS3Uploader.uploadStream(
//       "test-bucket",
//       "uploads/example.txt",
//       uploadStream
//     );

//     // Download example
//     const downloadStream = await customS3Uploader.downloadStream(
//       "test-bucket",
//       "uploads/avatar/1738660903833/74580834093107/unnamed.png",
//     );
//     const writeStream = fs.createWriteStream(
//       path.join(__dirname, "downloaded-example.txt"),
//     );
//     downloadStream.pipe(writeStream);
//   } catch (error) {
//     console.error("Stream operation failed:", error);
//   }
// }

// const uploadFilePath = "D:\\test\\video transcodeing\\output9\\1080p.mp4";
// const uploadStream = fs.createReadStream(uploadFilePath);
// customS3Uploader
//   .uploadStream(
//     "test-bucket",
//     "test-upload/output9/1080p.mp4",
//     uploadStream,
//     (progress) => {
//       console.log("Progress:", progress);
//     },
//   )
//   .then(() => {
//     console.log("Uploaded file successfully");
//   });

// customS3Uploader
//   .downloadStream(
//     "test-bucket",
//     "uploads/avatar/1738660903833/745808340931075.6/unnamed.png",
//   )
//   .then(downloadStream => {
//     console.log(downloadStream);
//     downloadStream.pipe(
//       fs.createWriteStream(path.join(__dirname, "downloaded-example.unnamed.png")),
//     ).on("finish", () => {
//       console.log("Downloaded file successfully");
//       console.log(path.join(__dirname, "downloaded-example.unnamed.png"));

//     });
//   })
//   .catch(console.error);

// Uncomment to run the example
// exampleStreamUsage().catch(console.error);
