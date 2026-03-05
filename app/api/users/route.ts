import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listUsersService } from '@/lib/services/userService';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await listUsersService({ page, limit });

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('GET Users Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Error details:', { errorMessage, stack: error instanceof Error ? error.stack : null });
    return NextResponse.json({ data: null, error: errorMessage }, { status: 500 });
  }
}
