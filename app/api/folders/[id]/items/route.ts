import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addFolderItemSchema } from "@/lib/validations";
import { canViewDocument } from "@/lib/permissions";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const folder = await prisma.folder.findUnique({ where: { id: params.id } });
    if (!folder) {
      return NextResponse.json({ data: null, error: 'Folder not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = addFolderItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });
    }

    const { documentId } = parsed.data;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { acl: true, requirement: true }
    });

    if (!document || document.deletedAt) {
      return NextResponse.json({ data: null, error: 'Document not found' }, { status: 404 });
    }

    const memberships = await prisma.departmentMember.findMany({
      where: { userId: session.user.id },
      select: { departmentId: true }
    });
    const userDepartmentIds = memberships.map((m: any) => m.departmentId);

    if (!canViewDocument(session.user.id, document, session.user.role, userDepartmentIds)) {
      return NextResponse.json({ data: null, error: 'Forbidden. Cannot view document.' }, { status: 403 });
    }

    const item = await prisma.folderItem.create({
      data: {
        folderId: params.id,
        documentId,
      }
    });

    return NextResponse.json({ data: { item }, error: null });
  } catch (error) {
    console.error('ADD FolderItem Error:', error);
    // Handle unique constraint error if item already in folder
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ data: null, error: 'Document is already in this folder' }, { status: 400 });
    }
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
