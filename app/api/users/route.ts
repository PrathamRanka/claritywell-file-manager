import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createUserSchema } from '@/lib/validations';
import { createUserService, listUsersService } from '@/lib/services/userService';
import { apiSuccess, apiForbidden, apiUnauthorized, apiError, apiValidationError } from '@/lib/utils/api-response';

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

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiUnauthorized();
    }
    if (session.user.role !== 'ADMIN') {
      return apiForbidden('Admin access required');
    }

    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.issues as any);
    }

    const { email, password, name, role } = parsed.data;

    const result = await createUserService({
      email,
      password,
      name,
      role,
    });

    if (result.error) {
      return apiError(result.error, result.status);
    }

    return apiSuccess(result.data, 201);
  } catch (error) {
    console.error('POST User Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return apiError(errorMessage, 500);
  }
}
