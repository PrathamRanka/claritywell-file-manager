import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getVisibleDocumentsWhereClause } from "@/lib/permissions";
import { Prisma } from "@/prisma/generated";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const pageParam = searchParams.get('page');

    if (!q) {
      return NextResponse.json({ data: { documents: [], comments: [] }, error: null });
    }

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = 20; // 20 of each
    const skip = (page - 1) * limit;

    const userId = session.user.id;
    const userRole = session.user.role || 'USER';

    const memberships = await prisma.departmentMember.findMany({
      where: { userId },
      select: { departmentId: true },
    });
    const userDepartmentIds = memberships.map((m: any) => m.departmentId);

    const docBaseWhere: Prisma.DocumentWhereInput = getVisibleDocumentsWhereClause(userId, userRole, userDepartmentIds);

    const docSearchWhere: Prisma.DocumentWhereInput = {
      ...docBaseWhere,
      OR: [
        ...(docBaseWhere.OR || []),
      ]
    };

    // Safely combine the search with the visible documents clause
    const documentWhere: Prisma.DocumentWhereInput = {
      AND: [
        docBaseWhere,
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { contentExcerpt: { contains: q, mode: 'insensitive' } },
          ],
        },
      ],
    };

    const commentWhere: Prisma.CommentWhereInput = {
      content: { contains: q, mode: 'insensitive' },
      document: docBaseWhere,
    };

    const [documents, comments] = await Promise.all([
      prisma.document.findMany({
        where: documentWhere,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          type: true,
          visibility: true,
          owner: { select: { name: true } },
          createdAt: true,
          contentExcerpt: true,
          mimeType: true,
        },
      }),
      prisma.comment.findMany({
        where: commentWhere,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { name: true } },
          document: { select: { title: true } },
        },
      }),
    ]);

    const formattedDocuments = documents.map((doc: any) => ({
      ...doc,
      ownerName: doc.owner.name,
      owner: undefined
    }));

    return NextResponse.json({
      data: {
        documents: formattedDocuments,
        comments,
      },
      error: null,
    });
  } catch (error) {
    console.error('GET Search Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
