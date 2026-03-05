import {
  listFoldersWithDocumentCount,
  findFolder,
  updateFolder,
  softDeleteFolder,
  createFolderItem,
  createFolder,
  listFolderItems,
} from '@/lib/repositories/folderRepository';
import { findDocumentWithRelations } from '@/lib/repositories/documentRepository';
import { getUserDepartmentIds } from '@/lib/helpers/userContext';
import { getVisibleDocumentsWhereClause, canManageFolder, canViewDocument } from '@/lib/permissions';

export async function listFoldersService(params: { userId: string; userRole: string }) {
  const { userId, userRole } = params;

  const userDepartmentIds = await getUserDepartmentIds(userId);
  const docWhere = getVisibleDocumentsWhereClause(userId, userRole, userDepartmentIds);

  const folders = await listFoldersWithDocumentCount(docWhere);

  return {
    data: {
      folders: folders.map((f: any) => ({
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
  name: string;
}) {
  const { folderId, userId, userRole, name } = params;

  const folder = await findFolder(folderId);
  if (!folder || folder.deletedAt) return { error: 'Not Found', status: 404 };

  if (!canManageFolder(userId, folder, userRole)) {
    return { error: 'Forbidden', status: 403 };
  }

  const updatedFolder = await updateFolder(folderId, name);
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

  const folder = await findFolder(folderId);
  if (!folder) return { error: 'Folder not found', status: 404 };

  const document = await findDocumentWithRelations(documentId);
  if (!document || document.deletedAt) return { error: 'Document not found', status: 404 };

  const userDepartmentIds = await getUserDepartmentIds(userId);

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
}) {
  const { userId, name, parentId } = params;
  const folder = await createFolder({ name, createdById: userId, parentId });
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

  const folder = await findFolder(folderId);
  if (!folder || folder.deletedAt) return { error: 'Not Found', status: 404 };

  if (!canManageFolder(userId, folder, userRole)) {
    return { error: 'Forbidden', status: 403 };
  }

  const items = await listFolderItems(folderId, skip, limit);
  return {
    data: {
      items,
      page,
    },
  };
}
