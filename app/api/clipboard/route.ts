import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Note: Clipboard is typically managed client-side in localStorage.
// This endpoint provides a server-side clipboard state placeholder.
// In a more advanced implementation, this could store clipboard state per user.

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

   return NextResponse.json({
      data: {
        documentIds: [],
        action: null, // 'copy' | 'cut' | null
      },
      error: null,
    });
  } catch (error) {
    console.error('GET Clipboard Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
