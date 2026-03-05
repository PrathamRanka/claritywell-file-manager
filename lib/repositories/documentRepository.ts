import { prisma } from '@/lib/prisma';
import { Prisma } from '@/prisma/generated';

/**
 * Fetches a document by ID including its ACL and requirement relations.
 * Exact query copied from documents/[id]/route.ts, documents/[id]/acl/route.ts, etc.
 */
export async function findDocumentWithRelations(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: { acl: true, requirement: true },
  });
}

/**
 * Fetches a document selecting only its ownerId (used for ACL revoke permission check).
 */
export async function findDocumentOwner(id: string) {
  return prisma.document.findUnique({
    where: { id },
    select: { ownerId: true },
  });
}

/**
 * Fetches a document selecting only deletedAt (used for restore).
 */
export async function findDocumentDeletedAt(id: string) {
  return prisma.document.findUnique({
    where: { id },
    select: { deletedAt: true },
  });
}

/**
 * Creates a document, optionally adding it to a folder and writing an audit log —
 * all inside a single Prisma transaction. Logic copied verbatim from documents/create/route.ts.
 */
export async function createDocument(data: {
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

/**
 * Updates a document's fields. Logic copied verbatim from documents/[id]/route.ts PATCH.
 */
export async function updateDocument(
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

/**
 * Soft-deletes a document by setting deletedAt. Logic from documents/[id]/route.ts DELETE.
 */
export async function softDeleteDocument(id: string) {
  return prisma.document.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/**
 * Restores a soft-deleted document. Logic from documents/[id]/restore/route.ts.
 */
export async function restoreDocument(id: string) {
  return prisma.document.update({
    where: { id },
    data: { deletedAt: null },
    select: { id: true, title: true },
  });
}

/**
 * Lists documents with permission-scoped where clause.
 * Logic from documents/route.ts.
 */
export async function listDocuments(where: Prisma.DocumentWhereInput, skip: number, limit: number) {
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

/**
 * Counts documents with the given where clause.
 */
export async function countDocuments(where: Prisma.DocumentWhereInput) {
  return prisma.document.count({ where });
}

/**
 * Counts documents matching a compound where clause — used for thumbnail permission check.
 */
export async function countDocumentsWhere(where: Prisma.DocumentWhereInput) {
  return prisma.document.count({ where });
}
