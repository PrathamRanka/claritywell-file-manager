import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createRequirementSchema } from '@/lib/validations';
import { listRequirementsService, createRequirementService } from '@/lib/services/requirementService';

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

    const result = await listRequirementsService({
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      departmentId,
      page,
      limit,
    });

    return NextResponse.json({ data: result.data, error: null });
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

    const result = await createRequirementService({
      userId: session.user.id,
      clientName,
      dueDate,
      priority,
      departmentId,
    });

    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('CREATE Requirement Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
