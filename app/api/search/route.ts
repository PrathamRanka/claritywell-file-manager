import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { advancedSearchService } from '@/lib/services/searchServiceAdvanced';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const pageParam = searchParams.get('page');

    if (!q) {
      return NextResponse.json({ data: { documents: [], comments: [], total: 0 }, error: null });
    }

    const page = pageParam ? parseInt(pageParam, 10) : 1;

    const result = await advancedSearchService({
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      q,
      page,
      limit: 20,
    });

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('GET Search Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
