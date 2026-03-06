import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createFolderSchema } from '@/lib/validations';
import { checkFolderCreationRateLimit } from '@/lib/rateLimit';
import { listFoldersService, createFolderService } from '@/lib/services/folderService';
import { apiSuccess, apiUnauthorized, apiError, apiValidationError, apiRateLimited } from '@/lib/utils/api-response';

export const dynamic = 'force-dynamic';

async function GETHandler(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await listFoldersService({
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      page,
      limit,
    });

    const folders = result.data?.folders || [];
    const total = result.data?.total || 0;
    const totalPages = result.data?.totalPages || 0;
    return apiSuccess({ folders, total, page, totalPages });
  } catch (error) {
    return apiError('Failed to fetch folders', 500);
  }
}

async function POSTHandler(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    if (!checkFolderCreationRateLimit(session.user.id)) {
      return apiRateLimited('Rate limit exceeded: 30 folders per hour');
    }

    const body = await req.json();
    const parsed = createFolderSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.issues as any);
    }

    const result = await createFolderService({
      userId: session.user.id,
      name: parsed.data.name,
      parentId: parsed.data.parentId,
      visibility: parsed.data.visibility,
    });

    return apiSuccess(result.data, 201);
  } catch (error) {
    return apiError('Failed to create folder', 500);
  }
}

export const GET = withRouteMetrics('/api/folders', 'GET', GETHandler);
export const POST = withRouteMetrics('/api/folders', 'POST', POSTHandler);
