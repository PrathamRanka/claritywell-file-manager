import { findDocumentWithRelations } from '@/lib/repositories/documentRepository';
import { findComment, createComment, listComments, countComments } from '@/lib/repositories/commentRepository';
import { getUserDepartmentIds } from '@/lib/helpers/userContext';
import { canCommentDocument, canViewDocument } from '@/lib/permissions';

export async function listCommentsService(params: {
  documentId: string;
  userId: string;
  userRole: string;
  page: number;
  limit: number;
}) {
  const { documentId, userId, userRole, page, limit } = params;
  const skip = (page - 1) * limit;

  const document = await findDocumentWithRelations(documentId);
  if (!document || document.deletedAt) {
    return { error: 'Not Found', status: 404 };
  }

  const userDepartmentIds = await getUserDepartmentIds(userId);

  if (!canViewDocument(userId, document, userRole, userDepartmentIds)) {
    return { error: 'Forbidden', status: 403 };
  }

  const [comments, total] = await Promise.all([
    listComments(documentId, skip, limit),
    countComments(documentId),
  ]);

  return {
    data: {
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createCommentService(params: {
  documentId: string;
  userId: string;
  userRole: string;
  content: string;
  parentCommentId?: string | null;
}) {
  const { documentId, userId, userRole, content, parentCommentId } = params;

  const document = await findDocumentWithRelations(documentId);
  if (!document || document.deletedAt) {
    return { error: 'Not Found', status: 404 };
  }

  const userDepartmentIds = await getUserDepartmentIds(userId);

  if (!canCommentDocument(userId, document, userRole, userDepartmentIds)) {
    return { error: 'Forbidden', status: 403 };
  }

  if (parentCommentId) {
    const parent = await findComment(parentCommentId);
    if (!parent || parent.documentId !== documentId) {
      return { error: 'Invalid parent comment', status: 400 };
    }
  }

  const comment = await createComment({
    content,
    authorId: userId,
    documentId,
    parentCommentId: parentCommentId || null,
  });

  return { data: { comment } };
}
