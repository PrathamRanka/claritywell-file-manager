import { prisma } from '@/lib/prisma';
import { Prisma } from '@/prisma/generated';

export async function createFolder(data: {
  name: string;
  createdById: string;
  parentId?: string | null;
  visibility?: string;
}) {
  return prisma.folder.create({
    data: data as any,
    select: { id: true, name: true, parentId: true, visibility: true, createdAt: true },
  });
}

export async function findFolder(id: string) {
  return prisma.folder.findUnique({ where: { id } });
}

export async function listFoldersWithDocumentCount(docWhere: Prisma.DocumentWhereInput) {
  // OPTIMIZATION: Use aggregation query instead of fetching all items
  // This prevents N+1 queries by counting in SQL rather than fetching all items
  const folders = await prisma.folder.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      parentId: true,
      createdById: true,
      createdAt: true,
      _count: {
        select: {
          items: {
            where: { document: docWhere }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  // Transform to match expected format
  return folders.map(folder => ({
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    createdById: folder.createdById,
    createdAt: folder.createdAt,
    items: Array(folder._count.items).fill({ id: '' }), // Dummy array for length check
  }));
}

export async function updateFolder(id: string, name?: string, visibility?: string) {
  const updateData: any = {};
  if (name) updateData.name = name;
  if (visibility) updateData.visibility = visibility;
  
  return prisma.folder.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, visibility: true, createdAt: true },
  });
}

export async function softDeleteFolder(id: string) {
  return prisma.$transaction([
    prisma.folderItem.deleteMany({ where: { folderId: id } }),
    prisma.folder.update({ where: { id }, data: { deletedAt: new Date() } }),
  ]);
}

export async function createFolderItem(folderId: string, documentId: string) {
  return prisma.folderItem.create({ data: { folderId, documentId } });
}

export async function findFolderItem(folderId: string, documentId: string) {
  return prisma.folderItem.findUnique({
    where: { folderId_documentId: { folderId, documentId } },
  });
}

export async function deleteFolderItemsByDocument(documentId: string) {
  return prisma.folderItem.deleteMany({ where: { documentId } });
}

export async function moveFolderItem(documentId: string, destinationFolderId: string) {
  return prisma.$transaction([
    prisma.folderItem.deleteMany({ where: { documentId } }),
    prisma.folderItem.create({ data: { documentId, folderId: destinationFolderId } }),
  ]);
}

export async function listFolderItems(folderId: string, skip: number = 0, limit: number = 50) {
  return listFolderItemsByDocumentWhere(folderId, { deletedAt: null }, skip, limit);
}

export async function listFolderItemsByDocumentWhere(
  folderId: string,
  documentWhere: Prisma.DocumentWhereInput,
  skip: number = 0,
  limit: number = 50
) {
  // OPTIMIZATION: Use more efficient field selection, avoid loading unnecessary data
  return prisma.folderItem.findMany({
    where: { folderId, document: documentWhere },
    select: {
      id: true,
      folderId: true,
      documentId: true,
      createdAt: true,
      document: {
        select: {
          id: true,
          title: true,
          type: true,
          ownerId: true,
          visibility: true,
          mimeType: true,
          contentExcerpt: true,
          thumbnailPath: true,
          createdAt: true,
          updatedAt: true,
          owner: { 
            select: { 
              id: true,
              name: true, 
              email: true 
            } 
          },
        },
      },
    },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}

export async function countFolderItemsByDocumentWhere(
  folderId: string,
  documentWhere: Prisma.DocumentWhereInput
) {
  return prisma.folderItem.count({
    where: {
      folderId,
      document: documentWhere,
    },
  });
}
