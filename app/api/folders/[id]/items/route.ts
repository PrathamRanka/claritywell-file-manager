import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { addFolderItemSchema } from '@/lib/validations';
import { addFolderItemService } from '@/lib/services/folderService';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = addFolderItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });
    }

    const result = await addFolderItemService({
      folderId: params.id,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      documentId: parsed.data.documentId,
    });

    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('ADD FolderItem Error:', error);
    // Handle unique constraint error if item already in folder
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ data: null, error: 'Document is already in this folder' }, { status: 400 });
    }
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
