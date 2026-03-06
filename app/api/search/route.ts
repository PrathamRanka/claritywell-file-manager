import { withRouteMetrics } from '@/lib/utils/route-metrics';
import { auth } from '@/auth';
import { searchService } from '@/lib/services/searchServiceAdvanced';
import { apiSuccess, apiUnauthorized, apiError } from '@/lib/utils/api-response';

export const dynamic = 'force-dynamic';

async function GETHandler(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const pageParam = searchParams.get('page');
    const advanced = searchParams.get('advanced') === 'true';

    if (!q) {
      return apiSuccess({ documents: [], comments: [], total: 0 });
    }

    const page = pageParam ? parseInt(pageParam, 10) : 1;

    const result = await searchService({
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      q,
      page,
      limit: 20,
      useAdvanced: advanced,
    });

    return apiSuccess(result.data);
  } catch (error) {
    return apiError('Search failed', 500);
  }
}

export const GET = withRouteMetrics('/api/search', 'GET', GETHandler);
