import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export function createFolder(data: {
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

export function findFolder(id: string) {
  return prisma.folder.findUnique({
    where: { id },
    select: { id: true, name: true, parentId: true, visibility: true, createdById: true, createdAt: true, deletedAt: true },
  });
}

export async function listFoldersWithDocumentCount(docWhere: Prisma.DocumentWhereInput, skip?: number, limit?: number) {
  const folders = await prisma.folder.findMany({
    where: { deletedAt: null },
    ...(skip !== undefined && { skip }),
    ...(limit !== undefined && { take: limit }),
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

  return folders.map(folder => ({
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    createdById: folder.createdById,
    createdAt: folder.createdAt,
    items: Array(folder._count.items).fill({ id: '' }),
  }));
}

export function countFolders() {
  return prisma.folder.count({ where: { deletedAt: null } });
}

export function updateFolder(id: string, name?: string, visibility?: string) {
  const data: any = {};
  if (name) data.name = name;
  if (visibility) data.visibility = visibility;
  
  return prisma.folder.update({
    where: { id },
    data,
    select: { id: true, name: true, visibility: true, createdAt: true },
  });
}

export function softDeleteFolder(id: string) {
  return prisma.$transaction([
    prisma.folderItem.deleteMany({ where: { folderId: id } }),
    prisma.folder.update({ where: { id }, data: { deletedAt: new Date() } }),
  ]);
}

export function createFolderItem(folderId: string, documentId: string) {
  return prisma.folderItem.create({ data: { folderId, documentId } });
}

export function findFolderItem(folderId: string, documentId: string) {
  return prisma.folderItem.findUnique({
    where: { folderId_documentId: { folderId, documentId } },
    select: { id: true, folderId: true, documentId: true, createdAt: true },
  });
}

export function deleteFolderItemsByDocument(documentId: string) {
  return prisma.folderItem.deleteMany({ where: { documentId } });
}

export function moveFolderItem(documentId: string, destinationFolderId: string) {
  return prisma.$transaction([
    prisma.folderItem.deleteMany({ where: { documentId } }),
    prisma.folderItem.create({ data: { documentId, folderId: destinationFolderId } }),
  ]);
}

export function listFolderItems(folderId: string, skip: number = 0, limit: number = 50) {
  return listFolderItemsByDocumentWhere(folderId, { deletedAt: null }, skip, limit);
}

export function listFolderItemsByDocumentWhere(
  folderId: string,
  documentWhere: Prisma.DocumentWhereInput,
  skip: number = 0,
  limit: number = 50
) {
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

export function countFolderItemsByDocumentWhere(
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
