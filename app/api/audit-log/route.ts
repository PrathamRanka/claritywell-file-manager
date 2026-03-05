import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listAuditLogsService } from '@/lib/services/auditLogService';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const documentId = searchParams.get('documentId');
    const action = searchParams.get('action');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await listAuditLogsService({ userId, documentId, action, page, limit });

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('GET Audit Log Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
