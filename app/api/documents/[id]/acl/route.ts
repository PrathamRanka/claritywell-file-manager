import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateDocumentAclSchema } from '@/lib/validations';
import { upsertAclService } from '@/lib/services/aclService';

export const dynamic = 'force-dynamic';

async function POSTHandler(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = updateDocumentAclSchema.safeParse(body);
    if (!parsed.success) return timedJson({ data: null, error: parsed.error.issues }, { status: 400 });

    const { userId, canView, canComment, canEdit } = parsed.data;

    const result = await upsertAclService({
      documentId: params.id,
      requesterId: session.user.id,
      requesterRole: session.user.role || 'USER',
      userId,
      canView,
      canComment,
      canEdit,
    });

    if (result.error) {
      return timedJson({ data: null, error: result.error }, { status: result.status });
    }

    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('ACL UPSERT Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withRouteMetrics('/api/documents/[id]/acl', 'POST', POSTHandler);
