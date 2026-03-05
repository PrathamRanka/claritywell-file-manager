import { NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { prisma } from '../../../lib/prisma';
import { createRequirementSchema } from '../../../lib/validations';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const whereClause = departmentId ? { departmentId } : {};

    const requirements = await prisma.requirement.findMany({
      where: whereClause,
      take: limit,
      skip,
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        clientName: true,
        dueDate: true,
        priority: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      }
    });

    return NextResponse.json({ data: { requirements }, error: null });
  } catch (error) {
    console.error('GET Requirements Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createRequirementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });
    }

    const { clientName, dueDate, priority, departmentId } = parsed.data;

    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) {
      return NextResponse.json({ data: null, error: 'Department not found' }, { status: 404 });
    }

    const requirement = await prisma.requirement.create({
      data: {
        clientName,
        dueDate,
        priority,
        departmentId,
        createdById: session.user.id
      },
      select: {
        id: true,
        clientName: true,
        dueDate: true,
        priority: true,
        departmentId: true,
      }
    });

    return NextResponse.json({ data: { requirement }, error: null });
  } catch (error) {
    console.error('CREATE Requirement Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
