import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '@/lib/s3';
import { env } from '@/lib/env';

export async function getSignedDownloadUrl(key: string, expiresIn: number): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.SUPABASE_S3_BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  size: number,
  expiresIn: number
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.SUPABASE_S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}
