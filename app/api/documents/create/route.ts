import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createDocumentSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rateLimit';
import { createDocumentService } from '@/lib/services/documentService';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`doc_create_${ip}`, 10, 60000)) {
      return NextResponse.json({ data: null, error: 'Too Many Requests' }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
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

    return NextResponse.json({ data: { document: result }, error: null });
  } catch (error) {
    console.error('CREATE Document Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
