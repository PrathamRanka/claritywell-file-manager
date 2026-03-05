import { findFolder, findFolderItem, moveFolderItem, createFolderItem } from '@/lib/repositories/folderRepository';
import { findDocumentWithRelations } from '@/lib/repositories/documentRepository';
import { canMoveOrDeleteDocument } from '@/lib/permissions';

export async function clipboardPasteService(params: {
  userId: string;
  userRole: string;
  documentIds: string[];
  destinationFolderId: string;
  action: 'copy' | 'cut';
}) {
  const { userId, userRole, documentIds, destinationFolderId, action } = params;

  const destinationFolder = await findFolder(destinationFolderId);
  if (!destinationFolder) {
    return { error: 'Destination folder not found', status: 404 };
  }

  const succeeded: string[] = [];
  const failed: { id: string; reason: string }[] = [];

  for (const docId of documentIds) {
    try {
      const document = await findDocumentWithRelations(docId);

      if (!document || document.deletedAt) {
        failed.push({ id: docId, reason: 'Document not found' });
        continue;
      }

      if (!canMoveOrDeleteDocument(userId, document, userRole)) {
        failed.push({ id: docId, reason: 'Forbidden' });
        continue;
      }

      if (action === 'cut') {
        await moveFolderItem(docId, destinationFolderId);
      } else if (action === 'copy') {
        const exists = await findFolderItem(destinationFolderId, docId);
        if (!exists) {
          await createFolderItem(destinationFolderId, docId);
        }
      }

      succeeded.push(docId);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        failed.push({ id: docId, reason: 'Already in destination folder' });
      } else {
        failed.push({ id: docId, reason: 'Internal error' });
      }
    }
  }

  return { data: { succeeded, failed } };
}
