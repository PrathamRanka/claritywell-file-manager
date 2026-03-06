import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function GETHandler(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can access this endpoint
    if (session.user.role !== 'ADMIN') {
      return timedJson({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all folders
    const folders = await prisma.folder.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        visibility: true,
        parentId: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return timedJson({ data: { folders }, error: null });
  } catch (error) {
    console.error('GET Admin Folders Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withRouteMetrics('/api/admin/folders', 'GET', GETHandler);
