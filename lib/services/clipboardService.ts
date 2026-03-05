import { prisma } from '@/lib/prisma';
import { findFolder, findFolderItem, moveFolderItem, createFolderItem } from '@/lib/repositories/folderRepository';
import { findDocumentWithRelations } from '@/lib/repositories/documentRepository';
import { canMoveOrDeleteDocument } from '@/lib/permissions';

/**
 * Copies or cuts a list of documents to a destination folder.
 * Logic copied verbatim from clipboard/paste/route.ts.
 */
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
        // Delete all existing folder associations and move to new folder
        await moveFolderItem(docId, destinationFolderId);
      } else if (action === 'copy') {
        // Add to new folder, ignore if already exists
        const exists = await findFolderItem(destinationFolderId, docId);
        if (!exists) {
          await createFolderItem(destinationFolderId, docId);
        }
      }

      succeeded.push(docId);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        // Already exists in destination
        failed.push({ id: docId, reason: 'Already in destination folder' });
      } else {
        failed.push({ id: docId, reason: 'Internal error' });
      }
    }
  }

  return { data: { succeeded, failed } };
}
