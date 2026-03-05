import { Prisma, Role } from '../prisma/generated';

export type DocumentWithRelations = Prisma.DocumentGetPayload<{
  include: {
    requirement: true;
    acl: true;
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

  return false;
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
