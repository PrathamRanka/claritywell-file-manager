import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { restoreDocumentService } from '@/lib/services/documentService';

async function POSTHandler(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return timedJson({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const result = await restoreDocumentService(params.id, session.user.id);

    if (result.error) {
      return timedJson({ data: null, error: result.error }, { status: result.status });
    }

    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('RESTORE Document Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withRouteMetrics('/api/documents/[id]/restore', 'POST', POSTHandler);
