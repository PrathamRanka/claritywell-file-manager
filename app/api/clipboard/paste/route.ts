import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { clipboardPasteSchema } from '@/lib/validations';
import { clipboardPasteService } from '@/lib/services/clipboardService';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = clipboardPasteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });

    const { documentIds, destinationFolderId, action } = parsed.data;

    const result = await clipboardPasteService({
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      documentIds,
      destinationFolderId,
      action,
    });

    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('Clipboard Paste Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
