import { prisma } from '@/lib/prisma';
import { getVisibleDocumentsWhereClause } from '@/lib/permissions';
import { getUserDepartmentIds } from '@/lib/helpers/userContext';
import { Prisma } from '@/prisma/generated';

export async function searchService(params: {
  userId: string;
  userRole: string;
  q: string;
  page: number;
}) {
  const { userId, userRole, q, page } = params;
  const limit = 20;
  const skip = (page - 1) * limit;

  const userDepartmentIds = await getUserDepartmentIds(userId);

  const docBaseWhere: Prisma.DocumentWhereInput = getVisibleDocumentsWhereClause(
    userId,
    userRole,
    userDepartmentIds
  );

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
    owner: undefined,
  }));

  return { data: { documents: formattedDocuments, comments } };
}
