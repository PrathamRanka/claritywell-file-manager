import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateDocumentSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rateLimit';
import {
  getDocumentService,
  updateDocumentService,
  deleteDocumentService,
} from '@/lib/services/documentService';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await getDocumentService({
      documentId: params.id,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      page,
      limit,
    });

    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('GET Document[id] Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`doc_patch_${ip}`, 10, 60000)) {
      return NextResponse.json({ data: null, error: 'Too Many Requests' }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = updateDocumentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });

    const { title, contentHtml, visibility } = parsed.data;

    const result = await updateDocumentService({
      documentId: params.id,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      title,
      contentHtml,
      visibility,
    });

    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('PATCH Document[id] Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const result = await deleteDocumentService({
      documentId: params.id,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
    });

    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('DELETE Document[id] Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
