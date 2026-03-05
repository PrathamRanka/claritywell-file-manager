import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { revokeAclService } from '@/lib/services/aclService';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const result = await revokeAclService({
      documentId: params.id,
      requesterId: session.user.id,
      requesterRole: session.user.role || 'USER',
      targetUserId: params.userId,
    });

    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('ACL DELETE Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
