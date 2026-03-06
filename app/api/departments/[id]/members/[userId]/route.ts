import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { removeDepartmentMemberService } from '@/lib/services/departmentService';

export const dynamic = 'force-dynamic';

async function DELETEHandler(
  req: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return timedJson({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const result = await removeDepartmentMemberService(params.userId, params.id);
    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('DELETE Dept Member Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const DELETE = withRouteMetrics('/api/departments/[id]/members/[userId]', 'DELETE', DELETEHandler);
