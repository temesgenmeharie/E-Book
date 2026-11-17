import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = `http://${process.env.STORAGE_ENDPOINT || "127.0.0.1"}:${process.env.STORAGE_PORT || "9000"}`;
const publicEndpoint = process.env.STORAGE_PUBLIC_ENDPOINT || `http://localhost:${process.env.STORAGE_PORT || "9000"}`;

export const s3Client = new S3Client({
  endpoint,
  region: "us-east-1", // Standard MinIO default region
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY || "minio_admin",
    secretAccessKey: process.env.STORAGE_SECRET_KEY || "minio_secret_secure",
  },
  forcePathStyle: true, // Crucial for MinIO and local S3-compatible proxies
});

export const publicS3Client = new S3Client({
  endpoint: publicEndpoint,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY || "minio_admin",
    secretAccessKey: process.env.STORAGE_SECRET_KEY || "minio_secret_secure",
  },
  forcePathStyle: true,
});

export const BUCKET_PRIVATE = process.env.STORAGE_BUCKET_PRIVATE || "ebook-private-assets";
export const BUCKET_PUBLIC = process.env.STORAGE_BUCKET_PUBLIC || "ebook-public-covers";

/**
 * Initializes private and public storage buckets if they do not exist.
 */
export async function ensureBucketsExist(): Promise<void> {
  const buckets = [BUCKET_PRIVATE, BUCKET_PUBLIC];

  for (const bucket of buckets) {
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch {
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
        console.log(`🪣 Created object storage bucket: ${bucket}`);
      } catch (err) {
        console.warn(`Could not create bucket ${bucket}:`, err);
      }
    }
  }
}

/**
 * Generates a presigned URL allowing the client to directly upload a binary file.
 */
export async function generatePresignedUploadUrl(params: {
  bucket: string;
  storageKey: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: params.bucket,
    Key: params.storageKey,
    ContentType: params.contentType,
  });

  return getSignedUrl(publicS3Client, command, {
    expiresIn: params.expiresInSeconds || 900, // 15 minutes default
  });
}

/**
 * Generates a short-lived presigned URL for downloading private assets.
 */
export async function generatePresignedDownloadUrl(params: {
  bucket: string;
  storageKey: string;
  expiresInSeconds?: number;
  filename?: string;
}): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: params.bucket,
    Key: params.storageKey,
    ResponseContentDisposition: params.filename
      ? `attachment; filename="${params.filename}"`
      : undefined,
  });

  return getSignedUrl(publicS3Client, command, {
    expiresIn: params.expiresInSeconds || 300, // 5 minutes default
  });
}

/**
 * Retrieves an authenticated readable stream with optional HTTP byte-range for in-browser readers.
 */
export async function getObjectStream(params: {
  bucket: string;
  storageKey: string;
  range?: string;
}) {
  const command = new GetObjectCommand({
    Bucket: params.bucket,
    Key: params.storageKey,
    Range: params.range,
  });

  return s3Client.send(command);
}

