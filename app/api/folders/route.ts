import { NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { prisma } from '../../../lib/prisma';
import { createFolderSchema } from '../../../lib/validations';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createFolderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });
    }

    const { name, parentId } = parsed.data;

    if (parentId) {
      const parentFolder = await prisma.folder.findUnique({ where: { id: parentId } });
      if (!parentFolder) {
        return NextResponse.json({ data: null, error: 'Parent folder not found' }, { status: 400 });
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        parentId: parentId || null,
        createdById: session.user.id,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ data: { folder }, error: null });
  } catch (error) {
    console.error('CREATE Folder Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
