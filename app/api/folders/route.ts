import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listFoldersService } from '@/lib/services/folderService';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const result = await listFoldersService({
      userId: session.user.id,
      userRole: session.user.role || 'USER',
    });

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('GET Folders Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
