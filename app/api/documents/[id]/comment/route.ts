import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createCommentSchema } from "@/lib/validations";
import { canCommentDocument } from "@/lib/permissions";
import { rateLimit } from "@/lib/rateLimit";

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

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: { acl: true, requirement: true }
    });

    if (!document || document.deletedAt) {
      return NextResponse.json({ data: null, error: 'Not Found' }, { status: 404 });
    }

    const memberships = await prisma.departmentMember.findMany({
      where: { userId: session.user.id },
      select: { departmentId: true }
    });
    const userDepartmentIds = memberships.map((m: any) => m.departmentId);

    if (!canCommentDocument(session.user.id, document, session.user.role, userDepartmentIds)) {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });
    }

    const { content, parentCommentId } = parsed.data;

    if (parentCommentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentCommentId } });
      if (!parent || parent.documentId !== params.id) {
        return NextResponse.json({ data: null, error: 'Invalid parent comment' }, { status: 400 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: session.user.id,
        documentId: params.id,
        parentCommentId: parentCommentId || null,
      },
      select: {
        id: true,
        content: true,
        documentId: true,
        createdAt: true,
        author: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({ data: { comment }, error: null });
  } catch (error) {
    console.error('CREATE Comment Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
