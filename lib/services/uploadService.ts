import { getSignedUploadUrl } from '@/lib/storage/s3Service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a presigned S3 PUT URL for an upload.
 * Logic copied verbatim from uploads/request/route.ts.
 */
export async function requestUploadService(params: {
  userId: string;
  fileName: string;
  contentType: string;
  size: number;
}) {
  const { userId, fileName, contentType, size } = params;

  const fileExtension = fileName.split('.').pop();
  const fileKey = `${userId}/${uuidv4()}-${Date.now()}.${fileExtension}`;

  // 15 minutes expiry
  const expiresIn = 15 * 60;
  const uploadUrl = await getSignedUploadUrl(fileKey, contentType, size, expiresIn);

  return {
    data: {
      uploadUrl,
      fileKey,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    },
  };
}
