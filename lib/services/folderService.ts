import {
  listFoldersWithDocumentCount,
  findFolder,
  updateFolder,
  softDeleteFolder,
  createFolderItem,
  createFolder,
  listFolderItemsByDocumentWhere,
  countFolderItemsByDocumentWhere,
} from '@/lib/repositories/folderRepository';
import { findDocumentWithRelations } from '@/lib/repositories/documentRepository';
import { getUserDepartmentIds } from '@/lib/helpers/userContext';
import { getVisibleDocumentsWhereClause, canManageFolder, canViewDocument } from '@/lib/permissions';

export async function listFoldersService(params: { userId: string; userRole: string }) {
  const { userId, userRole } = params;

  const userDepartmentIds = await getUserDepartmentIds(userId);
  const docWhere = getVisibleDocumentsWhereClause(userId, userRole, userDepartmentIds);

  const folders = await listFoldersWithDocumentCount(docWhere);
  const isAdmin = userRole === 'ADMIN';

  return {
    data: {
      folders: folders
        .filter((f: any) => isAdmin || f.createdById === userId || f.items.length > 0)
        .map((f: any) => ({
        id: f.id,
        name: f.name,
        parentId: f.parentId,
        documentCount: f.items.length,
      })),
    },
  };
}

export async function updateFolderService(params: {
  folderId: string;
  userId: string;
  userRole: string;
  name?: string;
  visibility?: string;
}) {
  const { folderId, userId, userRole, name, visibility } = params;

  const folder = await findFolder(folderId);
  if (!folder || folder.deletedAt) return { error: 'Not Found', status: 404 };

  if (!canManageFolder(userId, folder, userRole)) {
    return { error: 'Forbidden', status: 403 };
  }

  const updatedFolder = await updateFolder(folderId, name, visibility);
  return { data: { folder: updatedFolder } };
}

export async function deleteFolderService(params: {
  folderId: string;
  userId: string;
  userRole: string;
}) {
  const { folderId, userId, userRole } = params;

  const folder = await findFolder(folderId);
  if (!folder || folder.deletedAt) return { error: 'Not Found', status: 404 };

  if (!canManageFolder(userId, folder, userRole)) {
    return { error: 'Forbidden', status: 403 };
  }

  await softDeleteFolder(folderId);
  return { data: { success: true } };
}

export async function addFolderItemService(params: {
  folderId: string;
  userId: string;
  userRole: string;
  documentId: string;
}) {
  const { folderId, userId, userRole, documentId } = params;

  // OPTIMIZATION: Parallelize folder, document, and department lookups
  const [folder, document, userDepartmentIds] = await Promise.all([
    findFolder(folderId),
    findDocumentWithRelations(documentId),
    getUserDepartmentIds(userId),
  ]);

  if (!folder) return { error: 'Folder not found', status: 404 };
  if (!document || document.deletedAt) return { error: 'Document not found', status: 404 };

  if (!canViewDocument(userId, document, userRole, userDepartmentIds)) {
    return { error: 'Forbidden. Cannot view document.', status: 403 };
  }

  const item = await createFolderItem(folderId, documentId);
  return { data: { item } };
}

export async function createFolderService(params: {
  userId: string;
  name: string;
  parentId?: string | null;
  visibility?: string;
}) {
  const { userId, name, parentId, visibility } = params;
  const folder = await createFolder({ 
    name, 
    createdById: userId, 
    parentId,
    visibility: visibility || 'PRIVATE'
  });
  return { data: { folder } };
}

export async function listFolderItemsService(params: {
  folderId: string;
  userId: string;
  userRole: string;
  page: number;
  limit: number;
}) {
  const { folderId, userId, userRole, page, limit } = params;
  const skip = (page - 1) * limit;

  // OPTIMIZATION: Parallelize folder fetch and user department lookup
  const [folder, userDepartmentIds] = await Promise.all([
    findFolder(folderId),
    getUserDepartmentIds(userId),
  ]);

  if (!folder || folder.deletedAt) return { error: 'Not Found', status: 404 };

  const docWhere = getVisibleDocumentsWhereClause(userId, userRole, userDepartmentIds);
  const hasManagePermission = canManageFolder(userId, folder, userRole);

  if (!hasManagePermission) {
    const visibleItemCount = await countFolderItemsByDocumentWhere(folderId, docWhere);
    if (visibleItemCount === 0) {
      return { error: 'Forbidden', status: 403 };
    }
  }

  const effectiveDocWhere = hasManagePermission
    ? { deletedAt: null }
    : docWhere;

  const folderItems = await listFolderItemsByDocumentWhere(folderId, effectiveDocWhere, skip, limit);
  
  // Extract documents from folder items
  const items = folderItems.map((item: any) => item.document).filter(Boolean);
  
  return {
    data: {
      items,
      total: items.length,
      page,
    },
  };
}

export async function getFolderService(params: {
  folderId: string;
  userId: string;
  userRole: string;
}) {
  const { folderId, userId, userRole } = params;

  // OPTIMIZATION: Parallelize folder fetch and user department lookup
  const [folder, userDepartmentIds] = await Promise.all([
    findFolder(folderId),
    getUserDepartmentIds(userId),
  ]);

  if (!folder || folder.deletedAt) return { error: 'Not Found', status: 404 };

  if (!canManageFolder(userId, folder, userRole)) {
    const docWhere = getVisibleDocumentsWhereClause(userId, userRole, userDepartmentIds);
    const visibleItemCount = await countFolderItemsByDocumentWhere(folderId, docWhere);
    if (visibleItemCount === 0) {
      return { error: 'Forbidden', status: 403 };
    }
  }

  return {
    data: {
      folder: {
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
      },
    },
  };
}
