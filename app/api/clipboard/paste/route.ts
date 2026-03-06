import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { clipboardPasteSchema } from '@/lib/validations';
import { clipboardPasteService } from '@/lib/services/clipboardService';

export const dynamic = 'force-dynamic';

async function POSTHandler(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = clipboardPasteSchema.safeParse(body);
    if (!parsed.success) return timedJson({ data: null, error: parsed.error.issues }, { status: 400 });

    const { documentIds, destinationFolderId, action } = parsed.data;

    const result = await clipboardPasteService({
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      documentIds,
      destinationFolderId,
      action,
    });

    if (result.error) {
      return timedJson({ data: null, error: result.error }, { status: result.status });
    }

    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('Clipboard Paste Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withRouteMetrics('/api/clipboard/paste', 'POST', POSTHandler);
