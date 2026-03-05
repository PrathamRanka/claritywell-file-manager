import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createRequirementSchema } from '@/lib/validations';
import { listRequirementsService, createRequirementService } from '@/lib/services/requirementService';
import { apiSuccess, apiUnauthorized, apiError, apiValidationError } from '@/lib/utils/api-response';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiUnauthorized();
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

    return apiSuccess(result.data);
  } catch (error) {
    console.error('GET Requirements Error:', error);
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

    const body = await req.json();
    const parsed = createRequirementSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.issues as any);
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
      return apiError(result.error, result.status);
    }

    return apiSuccess(result.data, 201);
  } catch (error) {
    console.error('CREATE Requirement Error:', error);
    return apiError('Internal Server Error', 500);
  }
}
