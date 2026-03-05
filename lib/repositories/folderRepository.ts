import { prisma } from '@/lib/prisma';
import { Prisma } from '@/prisma/generated';

export async function createFolder(data: {
  name: string;
  createdById: string;
  parentId?: string | null;
}) {
  return prisma.folder.create({
    data: data as any,
    select: { id: true, name: true, parentId: true, createdAt: true },
  });
}

export async function findFolder(id: string) {
  return prisma.folder.findUnique({ where: { id } });
}

export async function listFoldersWithDocumentCount(docWhere: Prisma.DocumentWhereInput) {
  return prisma.folder.findMany({
    where: { deletedAt: null },
    include: {
      items: {
        where: { document: docWhere },
        select: { id: true },
      },
    },
  });
}

export async function updateFolder(id: string, name: string) {
  return prisma.folder.update({
    where: { id },
    data: { name },
    select: { id: true, name: true, createdAt: true },
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
  return prisma.folderItem.findMany({
    where: { folderId, document: { deletedAt: null } },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          type: true,
          ownerId: true,
          createdAt: true,
          owner: { select: { name: true, email: true } },
        },
      },
    },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}
