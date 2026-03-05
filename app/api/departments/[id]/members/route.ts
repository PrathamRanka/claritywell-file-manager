import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { prisma } from '../../../../../lib/prisma';
import { addDepartmentMemberSchema } from '../../../../../lib/validations';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = addDepartmentMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });
    }

    const { userId } = parsed.data;

    const department = await prisma.department.findUnique({ where: { id: params.id } });
    if (!department) {
      return NextResponse.json({ data: null, error: 'Department not found' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ data: null, error: 'User not found' }, { status: 404 });
    }

    const member = await prisma.departmentMember.create({
      data: {
        departmentId: params.id,
        userId
      }
    });

    return NextResponse.json({ data: { member }, error: null });
  } catch (error: any) {
    console.error('ADD Department Member Error:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ data: null, error: 'User is already a member of this department' }, { status: 400 });
    }
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
