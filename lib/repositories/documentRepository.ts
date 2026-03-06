import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export function findDocumentWithRelations(id: string) {
  return prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      type: true,
      visibility: true,
      contentHtml: true,
      contentExcerpt: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      mimeType: true,
      storagePath: true,
      thumbnailPath: true,
      requirement: { select: { id: true, clientName: true, departmentId: true } },
      acl: { select: { id: true, userId: true, canView: true, canEdit: true, canComment: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  });
}

export function findDocumentOwner(id: string) {
  return prisma.document.findUnique({
    where: { id },
    select: { ownerId: true },
  });
}

export function findDocumentDeletedAt(id: string) {
  return prisma.document.findUnique({
    where: { id },
    select: { deletedAt: true },
  });
}

export function createDocument(data: {
  title: string;
  type: string;
  visibility: string;
  storagePath?: string | null;
  mimeType?: string | null;
  contentHtml?: string | null;
  contentExcerpt?: string | null;
  ownerId: string;
  requirementId?: string | null;
  folderId?: string | null;
}) {
  const { folderId, ...docData } = data;
  return prisma.$transaction(async (tx) => {
    const doc = await tx.document.create({ data: docData as any });

    if (folderId) {
      await tx.folderItem.create({
        data: { folderId, documentId: doc.id },
      });
    }

    await tx.auditLog.create({
      data: {
        action: 'CREATE',
        userId: data.ownerId,
        documentId: doc.id,
        metadata: { folderId },
      },
    });

    return doc;
  });
}

export function updateDocument(
  id: string,
  data: {
    title?: string;
    visibility?: string;
    contentHtml?: string | null;
    contentExcerpt?: string | null;
  }
) {
  return prisma.document.update({ where: { id }, data: data as any });
}

export function softDeleteDocument(id: string) {
  return prisma.document.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export function restoreDocument(id: string) {
  return prisma.document.update({
    where: { id },
    data: { deletedAt: null },
    select: { id: true, title: true },
  });
}

export function listDocuments(where: Prisma.DocumentWhereInput, skip: number, limit: number) {
  return prisma.document.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      type: true,
      visibility: true,
      owner: { select: { name: true } },
      createdAt: true,
      contentExcerpt: true,
      mimeType: true,
    },
  });
}

export function countDocuments(where: Prisma.DocumentWhereInput) {
  return prisma.document.count({ where });
}

export function countDocumentsWhere(where: Prisma.DocumentWhereInput) {
  return prisma.document.count({ where });
}
