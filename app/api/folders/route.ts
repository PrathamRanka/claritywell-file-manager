import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createFolderSchema } from '@/lib/validations';
import { checkFolderCreationRateLimit } from '@/lib/rateLimit';
import { listFoldersService, createFolderService } from '@/lib/services/folderService';
import { apiSuccess, apiUnauthorized, apiError, apiValidationError, apiRateLimited } from '@/lib/utils/api-response';

async function GETHandler(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const result = await listFoldersService({
      userId: session.user.id,
      userRole: session.user.role || 'USER',
    });

    const folders = result.data?.folders || [];
    return apiSuccess({ folders });
  } catch (error) {
    console.error('GET Folders Error:', error);
    return apiError('Internal Server Error', 500);
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
    });

    return apiSuccess(result.data, 201);
  } catch (error) {
    console.error('POST Folder Error:', error);
    return apiError('Internal Server Error', 500);
  }
}

export const GET = withRouteMetrics('/api/folders', 'GET', GETHandler);
export const POST = withRouteMetrics('/api/folders', 'POST', POSTHandler);
