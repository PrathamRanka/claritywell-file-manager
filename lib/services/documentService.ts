import {
  findDocumentWithRelations,
  findDocumentDeletedAt,
  createDocument,
  updateDocument,
  softDeleteDocument,
  restoreDocument,
  listDocuments,
  countDocuments,
  countDocumentsWhere,
} from '@/lib/repositories/documentRepository';
import { listComments } from '@/lib/repositories/commentRepository';
import { createAuditLog } from '@/lib/repositories/auditLogRepository';
import { sanitizeHtml } from '@/lib/helpers/htmlSanitizer';
import { getUserDepartmentIds } from '@/lib/helpers/userContext';
import { getSignedDownloadUrl } from '@/lib/storage/s3Service';
import {
  canViewDocument,
  canEditDocument,
  canMoveOrDeleteDocument,
  getVisibleDocumentsWhereClause,
} from '@/lib/permissions';
import { Prisma } from '@/prisma/generated';

export function mapSafeDocument(doc: any) {
  return {
    id: doc.id,
    title: doc.title,
    type: doc.type,
    visibility: doc.visibility,
    ownerId: doc.ownerId,
    requirementId: doc.requirementId,
    contentExcerpt: doc.contentExcerpt,
    contentHtml: doc.contentHtml,
    mimeType: doc.mimeType,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    owner: doc.owner,
    requirement: doc.requirement,
  };
}

export async function createDocumentService(params: {
  userId: string;
  title: string;
  type: string;
  visibility: string;
  storagePath?: string | null;
  mimeType?: string | null;
  contentHtml?: string | null;
  requirementId?: string | null;
  folderId?: string | null;
}) {
  const { safeContentHtml, contentExcerpt } = sanitizeHtml(params.contentHtml);

  const newDocument = await createDocument({
    title: params.title,
    type: params.type,
    visibility: params.visibility,
    storagePath: params.storagePath,
    mimeType: params.mimeType,
    contentHtml: safeContentHtml,
    contentExcerpt,
    ownerId: params.userId,
    requirementId: params.requirementId,
    folderId: params.folderId,
  });

  return { data: { document: newDocument } };
}

export async function listDocumentsService(params: {
  userId: string;
  userRole: string;
  folderId?: string | null;
  q?: string | null;
  page: number;
  limit: number;
}) {
  const { userId, userRole, folderId, q, page, limit } = params;
  const skip = (page - 1) * limit;

  const userDepartmentIds = await getUserDepartmentIds(userId);

  const where: Prisma.DocumentWhereInput = getVisibleDocumentsWhereClause(
    userId,
    userRole,
    userDepartmentIds
  );

  if (q) {
    const searchClause: Prisma.DocumentWhereInput = {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { contentExcerpt: { contains: q, mode: 'insensitive' } },
      ],
    };
    where.AND = [searchClause];
  }

  if (folderId) {
    where.folderItems = { some: { folderId } };
  }

  const [rawDocuments, total] = await Promise.all([
    listDocuments(where, skip, limit),
    countDocuments(where),
  ]);

  const documents = rawDocuments.map((doc: any) => ({
    ...doc,
    ownerName: doc.owner.name,
    owner: undefined,
  }));

  return { data: { documents, total, page, totalPages: Math.ceil(total / limit) } };
}

export async function getDocumentService(params: {
  documentId: string;
  userId: string;
  userRole: string;
  page: number;
  limit: number;
}) {
  const { documentId, userId, userRole, page, limit } = params;
  const skip = (page - 1) * limit;

  const document = await findDocumentWithRelations(documentId);
  if (!document || document.deletedAt) return { error: 'Not Found', status: 404 };

  const userDepartmentIds = await getUserDepartmentIds(userId);

  if (!canViewDocument(userId, document, userRole, userDepartmentIds)) {
    return { error: 'Forbidden', status: 403 };
  }

  let signedUrl: string | null = null;
  if (document.storagePath) {
    signedUrl = await getSignedDownloadUrl(document.storagePath, 15 * 60);
  }

  const comments = await listComments(documentId, skip, limit);

  return {
    data: { document: mapSafeDocument(document), signedUrl, comments },
  };
}

export async function updateDocumentService(params: {
  documentId: string;
  userId: string;
  userRole: string;
  title?: string;
  contentHtml?: string | null;
  visibility?: string;
}) {
  const { documentId, userId, userRole, title, contentHtml, visibility } = params;

  const document = await findDocumentWithRelations(documentId);
  if (!document || document.deletedAt) return { error: 'Not Found', status: 404 };

  if (!canEditDocument(userId, document, userRole)) {
    return { error: 'Forbidden', status: 403 };
  }

  let updatedContentHtml: string | null | undefined = undefined;
  let contentExcerpt: string | null | undefined = undefined;

  if (contentHtml !== undefined) {
    const sanitized = sanitizeHtml(contentHtml);
    updatedContentHtml = sanitized.safeContentHtml;
    contentExcerpt = sanitized.contentExcerpt;
  }

  const updatedDocument = await updateDocument(documentId, {
    ...(title && { title }),
    ...(visibility && { visibility }),
    ...(contentHtml !== undefined && { contentHtml: updatedContentHtml, contentExcerpt }),
  });

  await createAuditLog({
    action: 'EDIT',
    userId,
    documentId,
    metadata: { updatedFields: [title, visibility, contentHtml !== undefined ? 'contentHtml' : undefined].filter(Boolean) },
  });

  return { data: { document: mapSafeDocument(updatedDocument) } };
}

export async function deleteDocumentService(params: {
  documentId: string;
  userId: string;
  userRole: string;
}) {
  const { documentId, userId, userRole } = params;

  const document = await findDocumentWithRelations(documentId);
  if (!document || document.deletedAt) return { error: 'Not Found', status: 404 };

  if (!canMoveOrDeleteDocument(userId, document, userRole)) {
    return { error: 'Forbidden', status: 403 };
  }

  await softDeleteDocument(documentId);
  await createAuditLog({ action: 'DELETE', userId, documentId });

  return { data: { success: true } };
}

export async function restoreDocumentService(documentId: string, userId: string) {
  const document = await findDocumentDeletedAt(documentId);
  if (!document) return { error: 'Not Found', status: 404 };
  if (!document.deletedAt) return { error: 'Document is not deleted', status: 400 };

  const restoredDocument = await restoreDocument(documentId);
  await createAuditLog({ action: 'RESTORE', userId, documentId });

  return { data: { document: restoredDocument } };
}

export async function getThumbnailUrlService(params: {
  documentId: string;
  userId: string;
  userRole: string;
}) {
  const { documentId, userId, userRole } = params;

  const document = await findDocumentWithRelations(documentId);
  if (!document || document.deletedAt) return { error: 'Not Found', status: 404 };
  if (!document.thumbnailPath) return { error: 'No thumbnail found', status: 404 };

  const userDepartmentIds = await getUserDepartmentIds(userId);
  const docWhere = getVisibleDocumentsWhereClause(userId, userRole, userDepartmentIds);

  const isVisible = await countDocumentsWhere({ id: documentId, ...docWhere });
  if (isVisible === 0) return { error: 'Forbidden', status: 403 };

  const signedUrl = await getSignedDownloadUrl(document.thumbnailPath, 5 * 60);

  return { data: { signedUrl } };
}
