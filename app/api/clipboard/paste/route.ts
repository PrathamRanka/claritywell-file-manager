import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { prisma } from '../../../../lib/prisma';
import { clipboardPasteSchema } from '../../../../lib/validations';
import { canMoveOrDeleteDocument } from '../../../../lib/permissions';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = clipboardPasteSchema.safeParse(body);

    if (!parsed.success) return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });

    const { documentIds, destinationFolderId, action } = parsed.data;

    const destinationFolder = await prisma.folder.findUnique({ where: { id: destinationFolderId } });
    if (!destinationFolder) return NextResponse.json({ data: null, error: 'Destination folder not found' }, { status: 404 });

    const succeeded: string[] = [];
    const failed: { id: string; reason: string }[] = [];

    for (const docId of documentIds) {
      try {
        const document = await prisma.document.findUnique({
          where: { id: docId },
          include: { acl: true, requirement: true }
        });

        if (!document || document.deletedAt) {
          failed.push({ id: docId, reason: 'Document not found' });
          continue;
        }

        if (!canMoveOrDeleteDocument(session.user.id, document, session.user.role)) {
          failed.push({ id: docId, reason: 'Forbidden' });
          continue;
        }

        if (action === 'cut') {
          // Delete all existing folder associations and move to new folder
          await prisma.$transaction([
            prisma.folderItem.deleteMany({ where: { documentId: docId } }),
            prisma.folderItem.create({ data: { documentId: docId, folderId: destinationFolderId } })
          ]);
        } else if (action === 'copy') {
          // Add to new folder, ignore if already exists
          const exists = await prisma.folderItem.findUnique({
            where: { folderId_documentId: { folderId: destinationFolderId, documentId: docId } }
          });
          if (!exists) {
            await prisma.folderItem.create({
              data: { documentId: docId, folderId: destinationFolderId }
            });
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

    return NextResponse.json({ data: { succeeded, failed }, error: null });
  } catch (error) {
    console.error('Clipboard Paste Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
