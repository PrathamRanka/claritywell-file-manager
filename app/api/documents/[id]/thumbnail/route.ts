import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getThumbnailUrlService } from '@/lib/services/documentService';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const result = await getThumbnailUrlService({
      documentId: params.id,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
    });

    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('GET Thumbnail Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
