import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getThumbnailUrlService } from '@/lib/services/documentService';

export const dynamic = 'force-dynamic';

async function GETHandler(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });

    const result = await getThumbnailUrlService({
      documentId: params.id,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
    });

    if (result.error) {
      return timedJson({ data: null, error: result.error }, { status: result.status });
    }

    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('GET Thumbnail Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withRouteMetrics('/api/documents/[id]/thumbnail', 'GET', GETHandler);
