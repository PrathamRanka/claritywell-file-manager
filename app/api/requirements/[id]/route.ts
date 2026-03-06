import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getRequirementService, deleteRequirementService } from '@/lib/services/requirementService';

async function GETHandler(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });

    const result = await getRequirementService({
      requirementId: params.id,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
    });

    if (result.error) {
      return timedJson({ data: null, error: result.error }, { status: result.status });
    }

    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('GET Requirement[id] Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

async function DELETEHandler(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return timedJson({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const result = await deleteRequirementService(params.id);
    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('DELETE Requirement Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withRouteMetrics('/api/requirements/[id]', 'GET', GETHandler);
export const DELETE = withRouteMetrics('/api/requirements/[id]', 'DELETE', DELETEHandler);
