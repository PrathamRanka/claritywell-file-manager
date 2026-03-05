import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateDocumentAclSchema } from "@/lib/validations";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: { acl: true, requirement: true }
    });

    if (!document || document.deletedAt) return NextResponse.json({ data: null, error: 'Not Found' }, { status: 404 });

    // Only owner or admin can manage ACL
    if (session.user.role !== 'ADMIN' && document.ownerId !== session.user.id) {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateDocumentAclSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });

    const { userId, canView, canComment, canEdit } = parsed.data;

    const acl = await prisma.documentACL.upsert({
      where: {
        documentId_userId: {
          documentId: params.id,
          userId,
        }
      },
      update: {
        canView: canView ?? true,
        canComment: canComment ?? false,
        canEdit: canEdit ?? false,
        grantedById: session.user.id,
      },
      create: {
        documentId: params.id,
        userId,
        canView: canView ?? true,
        canComment: canComment ?? false,
        canEdit: canEdit ?? false,
        grantedById: session.user.id,
      },
      select: {
          id: true,
          userId: true,
          canView: true,
          canComment: true,
          canEdit: true
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'SHARE',
        userId: session.user.id,
        documentId: params.id,
        metadata: { targetUserId: userId, permissions: { canView, canComment, canEdit } }
      }
    });

    return NextResponse.json({ data: { acl }, error: null });
  } catch (error) {
    console.error('ACL UPSERT Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
