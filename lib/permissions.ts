import { Prisma, Role } from '@prisma/client';

export type DocumentWithRelations = Prisma.DocumentGetPayload<{
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
  };
}>;

export function canViewDocument(
  userId: string,
  document: DocumentWithRelations,
  userRole: Role | string = 'USER',
  userDepartmentIds: string[] = []
): boolean {

  if (userRole === 'ADMIN') return true;

  if (document.ownerId === userId) return true;

  if (document.visibility === 'PRIVATE') return false;
  if (document.visibility === 'DEPARTMENT') {
    if (document.requirement?.departmentId) {
      return userDepartmentIds.includes(document.requirement.departmentId);
    }
    return false;
  }

  if (document.visibility === 'SHARED') {
    if (!document.acl || document.acl.length === 0) return false;
    return document.acl.some((acl) => acl.userId === userId && acl.canView);
  }

  return false;
}

export function canEditDocument(
  userId: string,
  document: DocumentWithRelations,
  userRole: Role | string = 'USER'
): boolean {
  if (userRole === 'ADMIN') return true;

  if (document.ownerId === userId) return true;

  if (document.visibility === 'SHARED' && document.acl) {
    return document.acl.some((acl) => acl.userId === userId && acl.canEdit);
  }

  return false;
}

export function canViewRequirement(
  userRole: Role | string,
  userDepartmentIds: string[],
  requirement: { departmentId: string }
): boolean {
  if (userRole === 'ADMIN') return true;
  return userDepartmentIds.includes(requirement.departmentId);
}

export function canCreateDocumentForRequirement(
  userRole: Role | string,
  userDepartmentIds: string[],
  requirement: { departmentId: string }
): boolean {
  if (userRole === 'ADMIN') return true;
  return userDepartmentIds.includes(requirement.departmentId);
}

export function canManageFolder(
  userId: string,
  folder: { createdById: string },
  userRole: Role | string = 'USER'
): boolean {
  if (userRole === 'ADMIN') return true;
  return folder.createdById === userId;
}

export function canAddToFolder(
  userId: string,
  document: DocumentWithRelations,
  userRole: Role | string = 'USER',
  userDepartmentIds: string[] = []
): boolean {
  const canView = canViewDocument(userId, document, userRole, userDepartmentIds);
  const canMove = userRole === 'ADMIN' || document.ownerId === userId;
  return canView && canMove;
}

export function canCommentDocument(
  userId: string,
  document: DocumentWithRelations,
  userRole: Role | string = 'USER',
  userDepartmentIds: string[] = []
): boolean {
  if (!canViewDocument(userId, document, userRole, userDepartmentIds)) {
    return false;
  }

  if (userRole === 'ADMIN' || document.ownerId === userId) {
    return true;
  }

  if (document.visibility === 'SHARED') {
    if (!document.acl) return false;
    return document.acl.some((acl) => acl.userId === userId && acl.canComment);
  }

  return true;
}

export function canMoveOrDeleteDocument(
  userId: string,
  document: DocumentWithRelations,
  userRole: Role | string = 'USER'
): boolean {
  return userRole === 'ADMIN' || document.ownerId === userId;
}

export function getVisibleDocumentsWhereClause(
  userId: string,
  userRole: Role | string,
  userDepartmentIds: string[]
): Prisma.DocumentWhereInput {
  const baseWhere: Prisma.DocumentWhereInput = {
    deletedAt: null,
  };

  if (userRole === 'ADMIN') {
    return baseWhere;
  }

  return {
    ...baseWhere,
    OR: [
      {
        visibility: 'PRIVATE',
        ownerId: userId,
      },
      {
        visibility: 'DEPARTMENT',
        OR: [
          { ownerId: userId },
          {
            requirement: {
              departmentId: {
                in: userDepartmentIds,
              },
            },
          },
        ],
      },
      {
        visibility: 'SHARED',
        OR: [
          { ownerId: userId },
          {
            acl: {
              some: {
                userId: userId,
                canView: true,
              },
            },
          },
        ],
      },
    ],
  };
}

export async function getAccessibleDepartments(
  userId: string,
  prisma: any
): Promise<string[]> {
  const memberships = await prisma.departmentMember.findMany({
    where: { userId },
    select: { departmentId: true }
  });
  return memberships.map((m: any) => m.departmentId);
}
