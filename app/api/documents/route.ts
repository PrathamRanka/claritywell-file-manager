import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listDocumentsService, createDocumentService } from '@/lib/services/documentService';
import { createDocumentSchema } from '@/lib/validations';
import { apiSuccess, apiUnauthorized, apiError, apiValidationError } from '@/lib/utils/api-response';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId');
    const q = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await listDocumentsService({
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      folderId,
      q,
      page,
      limit,
    });

    return apiSuccess(result.data);
  } catch (error) {
    console.error('GET Documents Error:', error);
    return apiError('Internal Server Error', 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiUnauthorized();
    }

    const body = await req.json();
    const parsed = createDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.issues as any);
    }

    const result = await createDocumentService({
      userId: session.user.id,
      ...parsed.data,
    });

    if (result.error) {
      return apiError(result.error, result.status || 400);
    }

    return apiSuccess(result.data, 201);
  } catch (error) {
    console.error('POST Document Error:', error);
    return apiError('Internal Server Error', 500);
  }
}
