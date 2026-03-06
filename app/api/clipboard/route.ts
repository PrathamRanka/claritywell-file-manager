import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Note: Clipboard is typically managed client-side in localStorage.
// This endpoint provides a server-side clipboard state placeholder.
// In a more advanced implementation, this could store clipboard state per user.

async function GETHandler(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

   return timedJson({
      data: {
        documentIds: [],
        action: null, // 'copy' | 'cut' | null
      },
      error: null,
    });
  } catch (error) {
    console.error('GET Clipboard Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withRouteMetrics('/api/clipboard', 'GET', GETHandler);
