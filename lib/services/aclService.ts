import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/repositories/auditLogRepository';

export async function upsertAclService(params: {
  documentId: string;
  requesterId: string;
  requesterRole: string;
  userId: string;
  canView?: boolean;
  canComment?: boolean;
  canEdit?: boolean;
}) {
  const { documentId, requesterId, requesterRole, userId, canView, canComment, canEdit } = params;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { acl: true, requirement: true },
  });

  if (!document || document.deletedAt) {
    return { error: 'Not Found', status: 404 };
  }

  if (requesterRole !== 'ADMIN' && document.ownerId !== requesterId) {
    return { error: 'Forbidden', status: 403 };
  }

  const acl = await prisma.documentACL.upsert({
    where: { documentId_userId: { documentId, userId } },
    update: {
      canView: canView ?? true,
      canComment: canComment ?? false,
      canEdit: canEdit ?? false,
      grantedById: requesterId,
    },
    create: {
      documentId,
      userId,
      canView: canView ?? true,
      canComment: canComment ?? false,
      canEdit: canEdit ?? false,
      grantedById: requesterId,
    },
    select: {
      id: true,
      userId: true,
      canView: true,
      canComment: true,
      canEdit: true,
    },
  });

  await createAuditLog({
    action: 'SHARE',
    userId: requesterId,
    documentId,
    metadata: { targetUserId: userId, permissions: { canView, canComment, canEdit } },
  });

  return { data: { acl } };
}

export async function revokeAclService(params: {
  documentId: string;
  requesterId: string;
  requesterRole: string;
  targetUserId: string;
}) {
  const { documentId, requesterId, requesterRole, targetUserId } = params;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  });

  if (!document) return { error: 'Not Found', status: 404 };

  if (requesterRole !== 'ADMIN' && document.ownerId !== requesterId) {
    return { error: 'Forbidden', status: 403 };
  }

  await prisma.documentACL.delete({
    where: { documentId_userId: { documentId, userId: targetUserId } },
  });

  await createAuditLog({
    action: 'SHARE',
    userId: requesterId,
    documentId,
    metadata: { targetUserId, action: 'REVOKE' },
  });

  return { data: { success: true } };
}
