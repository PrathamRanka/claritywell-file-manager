import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listDepartmentMembersService } from '@/lib/services/departmentService';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await listDepartmentMembersService({
      departmentId: params.id,
      page,
      limit,
    });

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('GET Dept Members Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
