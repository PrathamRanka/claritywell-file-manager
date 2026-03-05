import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getRequirementService, deleteRequirementService } from '@/lib/services/requirementService';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const result = await getRequirementService({
      requirementId: params.id,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
    });

    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('GET Requirement[id] Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const result = await deleteRequirementService(params.id);
    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('DELETE Requirement Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
