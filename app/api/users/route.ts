import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listUsersService } from '@/lib/services/userService';
import { apiSuccess, apiForbidden, apiUnauthorized, apiError } from '@/lib/utils/api-response';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiUnauthorized();
    }
    if (session.user.role !== 'ADMIN') {
      return apiForbidden('Admin access required');
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await listUsersService({ page, limit });

    return apiSuccess(result.data);
  } catch (error) {
    console.error('GET Users Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return apiError(errorMessage, 500);
  }
}
