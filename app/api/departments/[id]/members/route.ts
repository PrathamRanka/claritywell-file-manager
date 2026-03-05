import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { addDepartmentMemberSchema } from '@/lib/validations';
import { listDepartmentMembersService, addDepartmentMemberService } from '@/lib/services/departmentService';

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

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = addDepartmentMemberSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });

    const result = await addDepartmentMemberService(parsed.data.userId, params.id);

    return NextResponse.json({ data: result.data, error: null });
  } catch (error: any) {
    console.error('POST Dept Member Error:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ data: null, error: 'User is already a member of this department' }, { status: 400 });
    }
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
