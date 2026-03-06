import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateFolderSchema } from '@/lib/validations';
import { getFolderService, updateFolderService, deleteFolderService } from '@/lib/services/folderService';

export const dynamic = 'force-dynamic';

async function GETHandler(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });

    const result = await getFolderService({
      folderId: params.id,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
    });

    if (result.error) {
      return timedJson({ data: null, error: result.error }, { status: result.status });
    }

    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('GET Folder Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

async function PATCHHandler(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = updateFolderSchema.safeParse(body);
    if (!parsed.success) return timedJson({ data: null, error: parsed.error.issues }, { status: 400 });

    const result = await updateFolderService({
      folderId: params.id,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      name: parsed.data.name,
      visibility: parsed.data.visibility,
    });

    if (result.error) {
      return timedJson({ data: null, error: result.error }, { status: result.status });
    }

    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('PATCH Folder Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

async function DELETEHandler(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });

    const result = await deleteFolderService({
      folderId: params.id,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
    });

    if (result.error) {
      return timedJson({ data: null, error: result.error }, { status: result.status });
    }

    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('DELETE Folder Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withRouteMetrics('/api/folders/[id]', 'GET', GETHandler);
export const PATCH = withRouteMetrics('/api/folders/[id]', 'PATCH', PATCHHandler);
export const DELETE = withRouteMetrics('/api/folders/[id]', 'DELETE', DELETEHandler);
