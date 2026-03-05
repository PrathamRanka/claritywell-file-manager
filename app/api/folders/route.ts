import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createFolderSchema } from '@/lib/validations';
import { checkFolderCreationRateLimit } from '@/lib/rateLimit';
import { listFoldersService, createFolderService } from '@/lib/services/folderService';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const result = await listFoldersService({
      userId: session.user.id,
      userRole: session.user.role || 'USER',
    });

    // Ensure we return an array directly
    const folders = result.data?.folders || [];
    return NextResponse.json(folders);
  } catch (error) {
    console.error('GET Folders Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    if (!checkFolderCreationRateLimit(session.user.id)) {
      return NextResponse.json(
        { data: null, error: 'Rate limit exceeded: 30 folders per hour' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = createFolderSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });

    const result = await createFolderService({
      userId: session.user.id,
      name: parsed.data.name,
      parentId: parsed.data.parentId,
    });

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('POST Folder Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
