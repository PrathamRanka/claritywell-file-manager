import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listDocumentsService } from '@/lib/services/documentService';

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
