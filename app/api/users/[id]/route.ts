import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateUserSchema } from '@/lib/validations';
import { updateUserService, deleteUserService } from '@/lib/services/userService';

async function PATCHHandler(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return timedJson({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) return timedJson({ data: null, error: parsed.error.issues }, { status: 400 });

    const result = await updateUserService({
      userId: params.id,
      role: parsed.data.role,
      name: parsed.data.name,
    });

    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('PATCH User Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

async function DELETEHandler(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return timedJson({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const result = await deleteUserService(params.id);
    return timedJson({ data: result.data, error: null });
  } catch (error: any) {
    console.error('DELETE User Error:', error);
    if (error?.code === 'P2025') {
      return timedJson({ data: null, error: 'User not found' }, { status: 404 });
    }
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const PATCH = withRouteMetrics('/api/users/[id]', 'PATCH', PATCHHandler);
export const DELETE = withRouteMetrics('/api/users/[id]', 'DELETE', DELETEHandler);
