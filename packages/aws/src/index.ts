// import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

import { S3Client, PutObjectCommand, HeadObjectCommand, NotFound, S3ServiceException } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import mime from 'mime';
import loggerDefault, { Logger } from "@workspace/logger";

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
  maxSizeBytes?: number;
  expiresIn?: number;
  for: "avatar" | "video";
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

class CustomS3Uploader {
  private s3Client: S3Client;

  constructor(config: CustomS3Config) {
    this.s3Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      },
      // Force path-style URLs for many self-hosted S3 servers
      forcePathStyle: config.forcePathStyle ?? true
    });
  }

  async generatePresignedUrl(options: PresignedUrlOptions): Promise<PresignedUrlResponse> {
    // Validate content type
    if (!options.path && !options.fileName) {
      throw new Error('File name or path is required');
    }
    options.contentType = mime.getType(options.path ?? options.fileName as string);
    if (!options.contentType) {
      throw new Error('Invalid file extension');
    }

    if (options.for === "avatar") {
      options.path = options.path ?? `uploads/avatar/${Date.now()}/${Math.random()*10000000000000000}/${options.fileName}`;
      options.maxSizeBytes = options.maxSizeBytes ?? (15 * 1024 * 1024);
    }

    if (options.for === "video") {
      options.path = options.path ??  `uploads/avatar/${Date.now()}/${Math.random()*10000000000000000}/${options.fileName}`;
      options.maxSizeBytes = options.maxSizeBytes ?? (5 * 1024 * 1024 * 1024);
    }

    const command = new PutObjectCommand({
      Bucket: options.bucket,
      Key: options.path,
      ContentType: options.contentType,
      ContentLength: options.maxSizeBytes
    });

    try {
      // Generate pre-signed URL
      const expire = Date.now() + (options.expiresIn ?? 3600);
      const url = await getSignedUrl(this.s3Client, command, { 
        expiresIn: options.expiresIn ?? 3600 // URL expires in 1 hour by default
      }); 

      return {
        url,
        s3Data: {
          key: options.path!,
          maxFileSize: options.maxSizeBytes!,
          bucket: options.bucket,
          expire: new Date(expire),
        }
      };
    } catch (error) {
      console.error('Error generating pre-signed URL video:', error);
      throw new Error('Failed to generate pre-signed URL');
    }
  }

  async checkFileExists(opt: { key: string, bucket: string }): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({ Key: opt.key, Bucket: opt.bucket });
      console.log(await this.s3Client.send(command), "this.s3Client.send(command)");
      return true;
    } catch (error: NotFound | S3ServiceException | any) {
      if (error instanceof NotFound) {
        return false;
      }
      logger.error("@workspace/aws/src/index.ts (checkFileExists)", error);
      throw new Error('Failed to check file existence');
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
  endpoint: 'http://localhost:4568',
  region: 'auto',
  accessKeyId: "S3RVER",
  secretAccessKey: "S3RVER"
})
export { 
  CustomS3Uploader,
  customS3Uploader
};

customS3Uploader.checkFileExists({
  bucket: "test-bucket",
  key:"uploads/avatar/1738660903833/74580834093107/unnamed.png"
}).then(console.log).catch(console.error);