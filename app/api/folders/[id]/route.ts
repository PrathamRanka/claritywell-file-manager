import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateFolderSchema } from "@/lib/validations";
import { canManageFolder } from "@/lib/permissions";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const folder = await prisma.folder.findUnique({ where: { id: params.id } });
    if (!folder || folder.deletedAt) return NextResponse.json({ data: null, error: 'Not Found' }, { status: 404 });

    if (!canManageFolder(session.user.id, folder, session.user.role)) {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateFolderSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });

    const updatedFolder = await prisma.folder.update({
      where: { id: params.id },
      data: { name: parsed.data.name },
      select: { id: true, name: true, createdAt: true }
    });

    return NextResponse.json({ data: { folder: updatedFolder }, error: null });
  } catch (error) {
    console.error('PATCH Folder Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const folder = await prisma.folder.findUnique({ where: { id: params.id } });
    if (!folder || folder.deletedAt) return NextResponse.json({ data: null, error: 'Not Found' }, { status: 404 });

    if (!canManageFolder(session.user.id, folder, session.user.role)) {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete folder and remove items (FolderItem table)
    await prisma.$transaction([
      prisma.folderItem.deleteMany({ where: { folderId: params.id } }),
      prisma.folder.update({
        where: { id: params.id },
        data: { deletedAt: new Date() }
      })
    ]);

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error) {
    console.error('DELETE Folder Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
