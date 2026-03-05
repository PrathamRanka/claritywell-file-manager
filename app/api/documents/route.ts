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
    const folderId = searchParams.get('folderId');
    const q = searchParams.get('q');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const skip = (page - 1) * limit;

    const userId = session.user.id;
    const userRole = session.user.role || 'USER';

    // Fetch user department memberships
    const memberships = await prisma.departmentMember.findMany({
      where: { userId },
      select: { departmentId: true }
    });
    const userDepartmentIds = memberships.map((m: any) => m.departmentId);

    // Get base permissions clause
    const where: Prisma.DocumentWhereInput = getVisibleDocumentsWhereClause(
      userId,
      userRole,
      userDepartmentIds
    );

    // Add search conditions
    if (q) {
      const searchClause: Prisma.DocumentWhereInput = {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { contentExcerpt: { contains: q, mode: 'insensitive' } },
        ]
      };
      
      // If we already have a top-level AND or OR, we should wrap it carefully
      // But getVisibleDocumentsWhereClause returns an object with base fields and an OR array sometimes.
      // So combining using AND is safest.
      where.AND = [
        searchClause,
        // Since getVisibleDocumentsWhereClause might use OR, we can nest its result in AND if we wanted,
        // but Prisma handles AND and OR at the root. However, if where already has an AND, we'd need to append.
      ];
    }

    if (folderId) {
      where.folderItems = {
        some: { folderId }
      };
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
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
        }
      }),
      prisma.document.count({ where })
    ]);

    return NextResponse.json({ 
      data: {
        documents: documents.map((doc: any) => ({
          ...doc,
          ownerName: doc.owner.name,
          owner: undefined // flatten as requested or keep? "owner name" implies flat or just accessible
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }, 
      error: null 
    });

  } catch (error) {
    console.error('GET Documents Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
