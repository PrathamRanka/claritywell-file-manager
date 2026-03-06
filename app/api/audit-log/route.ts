import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listAuditLogsService } from '@/lib/services/auditLogService';
import { apiSuccess, apiForbidden, apiUnauthorized, apiError } from '@/lib/utils/api-response';

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
    const userId = searchParams.get('userId');
    const documentId = searchParams.get('documentId');
    const action = searchParams.get('action');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await listAuditLogsService({ userId, documentId, action, page, limit });

    return apiSuccess(result.data);
  } catch (error) {
    return apiError('Failed to fetch audit logs', 500);
  }
}

export const GET = withRouteMetrics('/api/audit-log', 'GET', GETHandler);
