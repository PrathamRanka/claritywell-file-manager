import {
  listFoldersWithDocumentCount,
  findFolder,
  updateFolder,
  softDeleteFolder,
  createFolderItem,
  findFolderItem,
} from '@/lib/repositories/folderRepository';
import { findDocumentWithRelations } from '@/lib/repositories/documentRepository';
import { getUserDepartmentIds } from '@/lib/helpers/userContext';
import { getVisibleDocumentsWhereClause, canManageFolder, canViewDocument } from '@/lib/permissions';

/**
 * Lists all visible folders with document counts per folder.
 * Logic copied verbatim from folders/route.ts.
 */
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

/**
 * Updates a folder's name.
 * Logic copied verbatim from folders/[id]/route.ts PATCH.
 */
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

/**
 * Soft-deletes a folder and its items.
 * Logic copied verbatim from folders/[id]/route.ts DELETE.
 */
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

/**
 * Adds a document to a folder (user must be able to view the document).
 * Logic copied verbatim from folders/[id]/items/route.ts.
 */
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
