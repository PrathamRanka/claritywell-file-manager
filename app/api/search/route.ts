import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { searchService } from '@/lib/services/searchService';

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
      return NextResponse.json({ data: { documents: [], comments: [] }, error: null });
    }

    const page = pageParam ? parseInt(pageParam, 10) : 1;

    const result = await searchService({
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      q,
      page,
    });

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('GET Search Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
