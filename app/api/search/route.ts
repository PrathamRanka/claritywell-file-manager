import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { advancedSearchService } from '@/lib/services/searchServiceAdvanced';
import { apiSuccess, apiUnauthorized, apiError } from '@/lib/utils/api-response';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const pageParam = searchParams.get('page');

    if (!q) {
      return apiSuccess({ documents: [], comments: [], total: 0 });
    }

    const page = pageParam ? parseInt(pageParam, 10) : 1;

    const result = await advancedSearchService({
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      q,
      page,
      limit: 20,
    });

    return apiSuccess(result.data);
  } catch (error) {
    console.error('GET Search Error:', error);
    return apiError('Internal Server Error', 500);
  }
}
