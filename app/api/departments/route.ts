import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createDepartmentSchema } from '@/lib/validations';
import { listDepartmentsService, createDepartmentService } from '@/lib/services/departmentService';
import { apiSuccess, apiForbidden, apiUnauthorized, apiError, apiValidationError } from '@/lib/utils/api-response';

export const dynamic = 'force-dynamic';

async function GETHandler(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiUnauthorized();
    }
    if (session.user.role !== 'ADMIN') {
      return apiForbidden('Admin access required');
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await listDepartmentsService({ page, limit });
    return apiSuccess(result.data);
  } catch (error) {
    console.error('GET Departments Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return apiError(errorMessage, 500);
  }
}

async function POSTHandler(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiUnauthorized();
    }
    if (session.user.role !== 'ADMIN') {
      return apiForbidden('Admin access required');
    }

    const body = await req.json();
    const parsed = createDepartmentSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.issues as any);
    }

    const result = await createDepartmentService(parsed.data.name);
    return apiSuccess(result.data, 201);
  } catch (error: any) {
    console.error('CREATE Department Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    if (error?.code === 'P2002') {
      return apiError('Department name already exists', 400, 'DUPLICATE_NAME');
    }
    return apiError(errorMessage, 500);
  }
}

export const GET = withRouteMetrics('/api/departments', 'GET', GETHandler);
export const POST = withRouteMetrics('/api/departments', 'POST', POSTHandler);
