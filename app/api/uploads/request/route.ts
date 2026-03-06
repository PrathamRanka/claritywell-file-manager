import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadRequestSchema } from '@/lib/validations';
import { rateLimit, checkUploadRateLimit } from '@/lib/rateLimit';
import { requestUploadService } from '@/lib/services/uploadService';

export const dynamic = 'force-dynamic';

async function POSTHandler(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkUploadRateLimit(session.user.id)) {
      return timedJson({ data: null, error: 'Upload limit exceeded' }, { status: 429 });
    }

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`upload_request_${ip}`, 10, 60000)) {
      return timedJson({ data: null, error: 'Too Many Requests' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = uploadRequestSchema.safeParse(body);
    if (!parsed.success) {
      return timedJson({ data: null, error: parsed.error.issues }, { status: 400 });
    }

    const { fileName, contentType, size } = parsed.data;

    const result = await requestUploadService({
      userId: session.user.id,
      fileName,
      contentType,
      size,
    });

    return timedJson({ data: result.data, error: null });
  } catch (error) {
    console.error('Upload Request Error:', error);
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withRouteMetrics('/api/uploads/request', 'POST', POSTHandler);
