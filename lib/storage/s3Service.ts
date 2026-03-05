import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '@/lib/s3';
import { env } from '@/lib/env';

export async function getSignedDownloadUrl(key: string, expiresIn: number): Promise<string | null> {
  console.log('🔐 Generating signed download URL for:', {
    bucket: env.SUPABASE_S3_BUCKET_NAME,
    key,
  });

  // Validate object existence first. Signed URL generation succeeds even for missing keys.
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: env.SUPABASE_S3_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error: any) {
    const statusCode = error?.$metadata?.httpStatusCode;
    const errorName = error?.name;
    if (statusCode === 404 || errorName === 'NotFound' || errorName === 'NoSuchKey') {
      console.warn('⚠️ Storage object not found for key:', key);
      return null;
    }

    console.error('❌ Failed to verify storage object:', error);
    throw error;
  }

  const command = new GetObjectCommand({
    Bucket: env.SUPABASE_S3_BUCKET_NAME,
    Key: key,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    console.log('✅ Signed download URL generated');
    return signedUrl;
  } catch (error) {
    console.error('❌ Failed to generate signed URL:', error);
    throw error;
  }
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  size: number,
  expiresIn: number
): Promise<string> {
  console.log('🔐 Generating signed upload URL for:', {
    bucket: env.SUPABASE_S3_BUCKET_NAME,
    key,
    contentType,
    size,
  });

  const command = new PutObjectCommand({
    Bucket: env.SUPABASE_S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  console.log('✅ Signed URL generated:', signedUrl.substring(0, 100) + '...');
  
  return signedUrl;
}
