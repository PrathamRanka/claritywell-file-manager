import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createCommentSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rateLimit';
import { createCommentService } from '@/lib/services/commentService';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`comment_create_${ip}`, 15, 60000)) {
      return NextResponse.json({ data: null, error: 'Too Many Requests' }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });
    }

    const { content, parentCommentId } = parsed.data;

    const result = await createCommentService({
      documentId: params.id,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      content,
      parentCommentId,
    });

    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('CREATE Comment Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
