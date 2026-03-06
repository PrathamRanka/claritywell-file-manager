import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { addFolderItemSchema } from '@/lib/validations';
import { addFolderItemService, listFolderItemsService } from '@/lib/services/folderService';

async function GETHandler(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await listFolderItemsService({
      folderId: params.id,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      page,
      limit,
    });

    if (result.error) {
      return timedJson({ data: null, error: result.error }, { status: result.status });
    }

    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('GET Folder Items Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

async function POSTHandler(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = addFolderItemSchema.safeParse(body);
    if (!parsed.success) {
      return timedJson({ data: null, error: parsed.error.issues }, { status: 400 });
    }

    const result = await addFolderItemService({
      folderId: params.id,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      documentId: parsed.data.documentId,
    });

    if (result.error) {
      return timedJson({ data: null, error: result.error }, { status: result.status });
    }

    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('ADD FolderItem Error:', error);
    // Handle unique constraint error if item already in folder
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return timedJson({ data: null, error: 'Document is already in this folder' }, { status: 400 });
    }
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withRouteMetrics('/api/folders/[id]/items', 'GET', GETHandler);
export const POST = withRouteMetrics('/api/folders/[id]/items', 'POST', POSTHandler);
