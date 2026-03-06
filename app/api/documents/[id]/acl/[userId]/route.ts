import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { revokeAclService } from '@/lib/services/aclService';

export const dynamic = 'force-dynamic';

async function DELETEHandler(
  req: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });

    const result = await revokeAclService({
      documentId: params.id,
      requesterId: session.user.id,
      requesterRole: session.user.role || 'USER',
      targetUserId: params.userId,
    });

    if (result.error) {
      return timedJson({ data: null, error: result.error }, { status: result.status });
    }

    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('ACL DELETE Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const DELETE = withRouteMetrics('/api/documents/[id]/acl/[userId]', 'DELETE', DELETEHandler);
