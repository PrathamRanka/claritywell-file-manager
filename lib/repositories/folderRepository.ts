import { prisma } from '@/lib/prisma';
import { Prisma } from '@/prisma/generated';

/**
 * Finds a single folder by ID.
 */
export async function findFolder(id: string) {
  return prisma.folder.findUnique({ where: { id } });
}

/**
 * Lists all non-deleted folders with a count of visible document items.
 * Logic copied verbatim from folders/route.ts.
 */
export async function listFoldersWithDocumentCount(docWhere: Prisma.DocumentWhereInput) {
  return prisma.folder.findMany({
    where: { deletedAt: null },
    include: {
      items: {
        where: { document: docWhere },
        select: { id: true },
      },
    },
  });
}

/**
 * Updates a folder's name. Logic copied from folders/[id]/route.ts PATCH.
 */
export async function updateFolder(id: string, name: string) {
  return prisma.folder.update({
    where: { id },
    data: { name },
    select: { id: true, name: true, createdAt: true },
  });
}

/**
 * Soft-deletes a folder and removes all FolderItem associations.
 * Logic copied verbatim from folders/[id]/route.ts DELETE.
 */
export async function softDeleteFolder(id: string) {
  return prisma.$transaction([
    prisma.folderItem.deleteMany({ where: { folderId: id } }),
    prisma.folder.update({ where: { id }, data: { deletedAt: new Date() } }),
  ]);
}

/**
 * Creates a FolderItem associating a document to a folder.
 */
export async function createFolderItem(folderId: string, documentId: string) {
  return prisma.folderItem.create({ data: { folderId, documentId } });
}

/**
 * Finds a specific FolderItem by composite key.
 */
export async function findFolderItem(folderId: string, documentId: string) {
  return prisma.folderItem.findUnique({
    where: { folderId_documentId: { folderId, documentId } },
  });
}

/**
 * Deletes all FolderItems for a given documentId (used for cut).
 */
export async function deleteFolderItemsByDocument(documentId: string) {
  return prisma.folderItem.deleteMany({ where: { documentId } });
}

/**
 * Moves a document to a destination folder (cut: delete all existing associations then create new).
 * Logic copied verbatim from clipboard/paste/route.ts cut branch.
 */
export async function moveFolderItem(documentId: string, destinationFolderId: string) {
  return prisma.$transaction([
    prisma.folderItem.deleteMany({ where: { documentId } }),
    prisma.folderItem.create({ data: { documentId, folderId: destinationFolderId } }),
  ]);
}
