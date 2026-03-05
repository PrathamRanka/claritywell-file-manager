import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listDocumentsService, createDocumentService } from '@/lib/services/documentService';
import { createDocumentSchema } from '@/lib/validations';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId');
    const q = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await listDocumentsService({
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      folderId,
      q,
      page,
      limit,
    });

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('GET Documents Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });
    }

    const result = await createDocumentService({
      userId: session.user.id,
      ...parsed.data,
    });

    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({ data: result.data, error: null }, { status: 201 });
  } catch (error) {
    console.error('POST Document Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
