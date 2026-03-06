import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { auth } from '@/auth';
import { updateDocumentSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rateLimit';
import {
  getDocumentService,
  updateDocumentService,
  deleteDocumentService,
} from '@/lib/services/documentService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params?: {
    id?: string;
  };
};

function getDocumentId(context: RouteContext): string | null {
  const documentId = context?.params?.id;
  if (!documentId || typeof documentId !== 'string') return null;
  return documentId;
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

async function GETHandler(req: Request, context: RouteContext) {
  try {
    const documentId = getDocumentId(context);
    if (!documentId) {
      return timedJson({ data: null, error: 'Invalid document id' }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.id) return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const limit = parsePositiveInt(searchParams.get('limit'), 20);

    const result = await getDocumentService({
      documentId,
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
    console.error('GET /api/documents/[id] failed:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

async function PATCHHandler(req: Request, context: RouteContext) {
  try {
    const documentId = getDocumentId(context);
    if (!documentId) {
      return timedJson({ data: null, error: 'Invalid document id' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`doc_patch_${ip}`, 10, 60000)) {
      return timedJson({ data: null, error: 'Too Many Requests' }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user?.id) return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = updateDocumentSchema.safeParse(body);
    if (!parsed.success) return timedJson({ data: null, error: parsed.error.issues }, { status: 400 });

    const { title, contentHtml, visibility } = parsed.data;

    const result = await updateDocumentService({
      documentId,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      title,
      contentHtml,
      visibility,
    });

    if (result.error) {
      return timedJson({ data: null, error: result.error }, { status: result.status });
    }

    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('PATCH /api/documents/[id] failed:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

async function DELETEHandler(req: Request, context: RouteContext) {
  try {
    const documentId = getDocumentId(context);
    if (!documentId) {
      return timedJson({ data: null, error: 'Invalid document id' }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.id) return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });

    const result = await deleteDocumentService({
      documentId,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
    });

    if (result.error) {
      return timedJson({ data: null, error: result.error }, { status: result.status });
    }

    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('DELETE /api/documents/[id] failed:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withRouteMetrics('/api/documents/[id]', 'GET', GETHandler);
export const PATCH = withRouteMetrics('/api/documents/[id]', 'PATCH', PATCHHandler);
export const DELETE = withRouteMetrics('/api/documents/[id]', 'DELETE', DELETEHandler);
