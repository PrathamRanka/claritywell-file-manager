import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createDepartmentSchema } from '@/lib/validations';
import { updateDepartmentService, deleteDepartmentService } from '@/lib/services/departmentService';

export const dynamic = 'force-dynamic';

async function POSTHandler(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return timedJson({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createDepartmentSchema.safeParse(body);
    if (!parsed.success) {
      return timedJson({ data: null, error: parsed.error.issues }, { status: 400 });
    }

    const result = await updateDepartmentService(params.id, parsed.data.name);
    return timedJson({ data: result.data, error: null });
  } catch (error: any) {
    console.error('UPDATE Department Error:', error);
    if (error?.code === 'P2002') {
      return timedJson({ data: null, error: 'Department name already exists' }, { status: 400 });
    }
    if (error?.code === 'P2025') {
      return timedJson({ data: null, error: 'Department not found' }, { status: 404 });
    }
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

    const result = await deleteDepartmentService(params.id);
    return timedJson({ data: result.data, error: null });
  } catch (error: any) {
    console.error('DELETE Department Error:', error);
    if (error?.code === 'P2025') {
      return timedJson({ data: null, error: 'Department not found' }, { status: 404 });
    }
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withRouteMetrics('/api/departments/[id]', 'POST', POSTHandler);
export const DELETE = withRouteMetrics('/api/departments/[id]', 'DELETE', DELETEHandler);
