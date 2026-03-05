import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createDocumentSchema } from '@/lib/validations';
import { checkDocumentCreationRateLimit } from '@/lib/rateLimit';
import { createDocumentService } from '@/lib/services/documentService';
import { generateThumbnailService } from '@/lib/services/thumbnailService';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkDocumentCreationRateLimit(session.user.id)) {
      return NextResponse.json(
        { data: null, error: 'Rate limit exceeded: 50 documents per hour' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = createDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });
    }

    const { title, type, visibility, storagePath, mimeType, contentHtml, requirementId, folderId } = parsed.data;

    const result = await createDocumentService({
      userId: session.user.id,
      title,
      type,
      visibility,
      storagePath,
      mimeType,
      contentHtml,
      requirementId,
      folderId,
    });

    // Generate thumbnail if document has storage path (async, don't wait)
    if (storagePath) {
      generateThumbnailService({
        documentId: result.id,
        documentType: type,
        storagePath,
        mimeType,
      }).catch((err) => console.error('Thumbnail generation failed:', err));
    }

    return NextResponse.json({ data: { document: result }, error: null });
  } catch (error) {
    console.error('CREATE Document Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
