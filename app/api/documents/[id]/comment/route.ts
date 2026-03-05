import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createCommentSchema } from '@/lib/validations';
import { checkCommentRateLimit } from '@/lib/rateLimit';
import { createCommentService, listCommentsService } from '@/lib/services/commentService';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await listCommentsService({
      documentId: params.id,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      page,
      limit,
    });

    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('GET Comments Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkCommentRateLimit(session.user.id)) {
      return NextResponse.json(
        { data: null, error: 'Rate limit exceeded: 100 comments per hour' },
        { status: 429 }
      );
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
