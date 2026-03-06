import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function isMissingVisibilityColumnError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('visibility') && msg.includes('column');
}

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

    // Avoid selecting a required relation directly; legacy/orphaned rows can throw.
    let rawFolders: Array<{
      id: string;
      name: string;
      visibility?: string;
      parentId: string | null;
      createdAt: Date;
      createdById: string;
    }> = [];

    try {
      rawFolders = await prisma.folder.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          visibility: true,
          parentId: true,
          createdAt: true,
          createdById: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (queryError) {
      // Backward compatibility for databases that do not yet have Folder.visibility.
      if (!isMissingVisibilityColumnError(queryError)) {
        throw queryError;
      }

      const foldersWithoutVisibility = await prisma.folder.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          parentId: true,
          createdAt: true,
          createdById: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      rawFolders = foldersWithoutVisibility.map((folder) => ({
        ...folder,
        visibility: 'PRIVATE',
      }));
    }

    const createdByIds = Array.from(new Set(rawFolders.map((folder) => folder.createdById)));
    const creators = createdByIds.length
      ? await prisma.user.findMany({
          where: { id: { in: createdByIds } },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      : [];

    const creatorById = new Map(creators.map((creator) => [creator.id, creator]));

    const folders = rawFolders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      visibility: folder.visibility || 'PRIVATE',
      parentId: folder.parentId,
      createdAt: folder.createdAt,
      createdBy: creatorById.get(folder.createdById) || null,
    }));

    return timedJson({ data: { folders }, error: null });
  } catch (error) {
    console.error('GET Admin Folders Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withRouteMetrics('/api/admin/folders', 'GET', GETHandler);
