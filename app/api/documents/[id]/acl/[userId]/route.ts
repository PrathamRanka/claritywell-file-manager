import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request, 
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      select: { ownerId: true }
    });

    if (!document) return NextResponse.json({ data: null, error: 'Not Found' }, { status: 404 });

    // Only owner or admin can manage ACL
    if (session.user.role !== 'ADMIN' && document.ownerId !== session.user.id) {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    await prisma.documentACL.delete({
      where: {
        documentId_userId: {
          documentId: params.id,
          userId: params.userId,
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'SHARE', // Or a new REVOKE action if preferred, but requirement said SHARE (action: SHARE) for upsert, taking liberty to use SHARE for revoke too or just generic log
        userId: session.user.id,
        documentId: params.id,
        metadata: { targetUserId: params.userId, action: 'REVOKE' }
      }
    });

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error) {
    console.error('ACL DELETE Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
