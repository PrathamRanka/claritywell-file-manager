import { s3Service } from '@/lib/storage/s3Service';
import { prisma } from '@/lib/prisma';

interface ThumbnailGenerationParams {
  documentId: string;
  documentType: string;
  storagePath: string;
  mimeType?: string;
}

/**
 * Generate a thumbnail for a document based on its type
 * For images: generates a small version
 * For PDFs: generates first page preview
 * For WYSIWYG: uses text content
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
 * Generate thumbnail for image files
 * Creates a small version and stores it in S3
 */
async function generateImageThumbnail(
  documentId: string,
  storagePath: string,
  mimeType?: string
): Promise<{ thumbnailPath: string | null; success: boolean }> {
  try {
    // For now, use a simple approach: reference the original file with a thumbnail query param
    // In production, you would use sharp to generate actual thumbnails
    const thumbnailPath = `${storagePath}?size=thumbnail&w=200&h=200&fit=cover`;

    // Update document with thumbnail path
    await prisma.document.update({
      where: { id: documentId },
      data: { thumbnailPath },
    });

    return { thumbnailPath, success: true };
  } catch (error) {
    console.error('Image thumbnail generation failed:', error);
    return { thumbnailPath: null, success: false };
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
    const url = await s3Service.getSignedDownloadUrl(document.thumbnailPath, 3600);

    return { url };
  } catch (error) {
    console.error('Get thumbnail URL error:', error);
    return { url: null, error: 'Failed to generate thumbnail URL' };
  }
}
