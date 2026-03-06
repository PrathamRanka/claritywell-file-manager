import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createCommentSchema } from '@/lib/validations';
import { checkCommentRateLimit } from '@/lib/rateLimit';
import { createCommentService, listCommentsService } from '@/lib/services/commentService';

export const dynamic = 'force-dynamic';

async function GETHandler(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await listCommentsService({
      documentId: params.id,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      page,
      limit,
    });

    if (result.error) {
      return timedJson({ data: null, error: result.error }, { status: result.status });
    }

    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('GET Comments Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

async function POSTHandler(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkCommentRateLimit(session.user.id)) {
      return timedJson(
        { data: null, error: 'Rate limit exceeded: 100 comments per hour' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return timedJson({ data: null, error: parsed.error.issues }, { status: 400 });
    }

    const { content, parentCommentId } = parsed.data;

    const result = await createCommentService({
      documentId: params.id,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      content,
      parentCommentId,
    });

    if (result.error) {
      return timedJson({ data: null, error: result.error }, { status: result.status });
    }

    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('CREATE Comment Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withRouteMetrics('/api/documents/[id]/comment', 'GET', GETHandler);
export const POST = withRouteMetrics('/api/documents/[id]/comment', 'POST', POSTHandler);
