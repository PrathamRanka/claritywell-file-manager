import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createDepartmentSchema } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const departments = await prisma.department.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });

    return NextResponse.json({ data: { departments }, error: null });
  } catch (error) {
    console.error('GET Departments Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createDepartmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });
    }

    const { name } = parsed.data;

    const department = await prisma.department.create({
      data: { name },
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });

    return NextResponse.json({ data: { department }, error: null });
  } catch (error: any) {
    console.error('CREATE Department Error:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ data: null, error: 'Department name already exists' }, { status: 400 });
    }
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
