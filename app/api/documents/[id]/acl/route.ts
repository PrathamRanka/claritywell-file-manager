import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateDocumentAclSchema } from '@/lib/validations';
import { upsertAclService } from '@/lib/services/aclService';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = updateDocumentAclSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });

    const { userId, canView, canComment, canEdit } = parsed.data;

    const result = await upsertAclService({
      documentId: params.id,
      requesterId: session.user.id,
      requesterRole: session.user.role || 'USER',
      userId,
      canView,
      canComment,
      canEdit,
    });

    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('ACL UPSERT Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
