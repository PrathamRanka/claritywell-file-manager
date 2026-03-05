import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createDepartmentSchema } from '@/lib/validations';
import { listDepartmentsService, createDepartmentService } from '@/lib/services/departmentService';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await listDepartmentsService({ page, limit });
    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('GET Departments Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Error details:', { errorMessage, stack: error instanceof Error ? error.stack : null });
    return NextResponse.json({ data: null, error: errorMessage }, { status: 500 });
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

    const result = await createDepartmentService(parsed.data.name);
    return NextResponse.json({ data: result.data, error: null });
  } catch (error: any) {
    console.error('CREATE Department Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Error details:', { errorMessage, stack: error instanceof Error ? error.stack : null });
    if (error?.code === 'P2002') {
      return NextResponse.json({ data: null, error: 'Department name already exists' }, { status: 400 });
    }
    return NextResponse.json({ data: null, error: errorMessage }, { status: 500 });
  }
}
