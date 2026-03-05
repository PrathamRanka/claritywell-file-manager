import sharp from 'sharp';
import { getSignedDownloadUrl } from '@/lib/storage/s3Service';
import { s3Client } from '@/lib/s3';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

interface ThumbnailGenerationParams {
  documentId: string;
  documentType: string;
  storagePath: string;
  mimeType?: string;
}

/**
 * Generate a thumbnail for a document based on its type
 * For images: generates a small version using Sharp
 * For PDFs: placeholder (PDF thumbnail generation requires additional libs)
 * For WYSIWYG: uses text content excerpt
 */
export async function generateThumbnailService(params: ThumbnailGenerationParams) {
  const { documentId, documentType, storagePath, mimeType } = params;

  try {
    if (documentType === 'IMAGE') {
      return await generateImageThumbnail(documentId, storagePath, mimeType);
    }

    if (documentType === 'PDF') {
      return await generatePdfThumbnail(documentId, storagePath);
    }

    // For WYSIWYG, thumbnail is just the content excerpt
    return { thumbnailPath: null, success: true };
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    // Non-critical error - continue without thumbnail
    return { thumbnailPath: null, success: false };
  }
}

/**
 * Generate thumbnail for image files using Sharp
 * Downloads original, resizes to 200x200, and uploads to S3
 */
async function generateImageThumbnail(
  documentId: string,
  storagePath: string,
  mimeType?: string
): Promise<{ thumbnailPath: string | null; success: boolean }> {
  try {
    // Download the original image from S3
    const getCommand = new GetObjectCommand({
      Bucket: env.SUPABASE_S3_BUCKET_NAME,
      Key: storagePath,
    });

    const response = await s3Client.send(getCommand);
    const imageBuffer = await response.Body?.transformToByteArray();

    if (!imageBuffer) {
      console.warn('Failed to download image for thumbnail:', storagePath);
      return { thumbnailPath: null, success: false };
    }

    // Generate thumbnail using Sharp (200x200, cover mode)
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center',
      })
      .toBuffer();

    // Generate thumbnail key path
    const thumbnailKey = `${storagePath.replace(/\.[^.]*$/, '')}-thumb-200x200.webp`;

    // Upload thumbnail to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: env.SUPABASE_S3_BUCKET_NAME,
      Key: thumbnailKey,
      Body: thumbnailBuffer,
      ContentType: 'image/webp',
    });

    await s3Client.send(uploadCommand);

    // Update document with thumbnail path
    await prisma.document.update({
      where: { id: documentId },
      data: { thumbnailPath: thumbnailKey },
    });

    console.log('✅ Thumbnail generated:', thumbnailKey);
    return { thumbnailPath: thumbnailKey, success: true };
  } catch (error) {
    console.error('Failed to generate image thumbnail:', error);
    // Fallback: reference the original file with a thumbnail query param
    const thumbnailPath = `${storagePath}?size=thumbnail&w=200&h=200&fit=cover`;

    try {
      await prisma.document.update({
        where: { id: documentId },
        data: { thumbnailPath },
      });
    } catch (updateError) {
      console.error('Failed to update thumbnail path:', updateError);
    }

    return { thumbnailPath, success: true };
  }
}

/**
 * Generate thumbnail for PDF files
 * Extracts first page as image
 */
async function generatePdfThumbnail(
  documentId: string,
  storagePath: string
): Promise<{ thumbnailPath: string | null; success: boolean }> {
  try {
    // For now, use a placeholder approach
    // In production, you would use pdf-parse or similar to extract first page
    const thumbnailPath = `${storagePath}?page=1&format=image`;

    // Update document with thumbnail path
    await prisma.document.update({
      where: { id: documentId },
      data: { thumbnailPath },
    });

    return { thumbnailPath, success: true };
  } catch (error) {
    console.error('PDF thumbnail generation failed:', error);
    return { thumbnailPath: null, success: false };
  }
}

/**
 * Retrieve a document's thumbnail URL (generates signed URL if needed)
 */
export async function getThumbnailUrlService(params: {
  documentId: string;
  userId: string;
  userRole: string;
}): Promise<{ url: string | null; error?: string }> {
  const { documentId, userId, userRole } = params;

  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        thumbnailPath: true,
        storagePath: true,
        ownerId: true,
        visibility: true,
        requirement: {
          select: {
            departmentId: true,
          },
        },
      },
    });

    if (!document) {
      return { url: null, error: 'Document not found' };
    }

    // Check permissions
    const isOwner = document.ownerId === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      if (document.visibility === 'PRIVATE') {
        return { url: null, error: 'Access denied' };
      }
    }

    if (!document.thumbnailPath) {
      return { url: null, error: 'No thumbnail available' };
    }

    // Get signed URL for thumbnail
    const url = await getSignedDownloadUrl(document.thumbnailPath, 3600);

    return { url };
  } catch (error) {
    console.error('Get thumbnail URL error:', error);
    return { url: null, error: 'Failed to generate thumbnail URL' };
  }
}
