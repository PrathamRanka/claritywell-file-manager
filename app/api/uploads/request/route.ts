import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadRequestSchema } from '@/lib/validations';
import { rateLimit, checkUploadRateLimit } from '@/lib/rateLimit';
import { requestUploadService } from '@/lib/services/uploadService';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkUploadRateLimit(session.user.id)) {
      return NextResponse.json({ data: null, error: 'Upload limit exceeded' }, { status: 429 });
    }

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`upload_request_${ip}`, 10, 60000)) {
      return NextResponse.json({ data: null, error: 'Too Many Requests' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = uploadRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });
    }

    const { fileName, contentType, size } = parsed.data;

    const result = await requestUploadService({
      userId: session.user.id,
      fileName,
      contentType,
      size,
    });

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('Upload Request Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
