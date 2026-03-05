import { findDocumentWithRelations } from '@/lib/repositories/documentRepository';
import { findComment, createComment } from '@/lib/repositories/commentRepository';
import { getUserDepartmentIds } from '@/lib/helpers/userContext';
import { canCommentDocument } from '@/lib/permissions';

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
