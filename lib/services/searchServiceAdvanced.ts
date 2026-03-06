import { prisma } from '@/lib/prisma';
import { getVisibleDocumentsWhereClause } from '@/lib/permissions';
import { getUserDepartmentIds } from '@/lib/helpers/userContext';
import { getPagination, getPaginationMeta } from '@/lib/utils/pagination';
import { Prisma } from '@prisma/client';

export async function searchService(params: {
  userId: string;
  userRole: string;
  q: string;
  page: number;
  limit?: number;
  useAdvanced?: boolean;
}) {
  const { userId, userRole, q, page, limit = 20, useAdvanced = false } = params;
  const { skip, take } = getPagination(page, limit);

  if (!q?.trim()) {
    return { data: { documents: [], comments: [], total: 0 } };
  }

  const query = q.trim();
  const userDepartmentIds = await getUserDepartmentIds(userId);
  const docBaseWhere = getVisibleDocumentsWhereClause(userId, userRole, userDepartmentIds);

  if (useAdvanced) {
    try {
      return await postgresFullTextSearch({ userId, query, docBaseWhere, skip, take, page, limit });
    } catch (_error) {
      return await basicSearch({ query, docBaseWhere, skip, take, page, limit });
    }
  }

  return await basicSearch({ query, docBaseWhere, skip, take, page, limit });
}

async function postgresFullTextSearch(params: {
  userId: string;
  query: string;
  docBaseWhere: Prisma.DocumentWhereInput;
  skip: number;
  take: number;
  page: number;
  limit: number;
}) {
  const { userId, query, docBaseWhere, skip, take, page, limit } = params;

  const [documents, comments, totalResult] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        type: string;
        visibility: string;
        owner_name: string;
        created_at: Date;
        content_excerpt: string | null;
        mime_type: string | null;
        rank: number;
      }>
    >`
      SELECT 
        d.id,
        d.title,
        d.type,
        d.visibility,
        u.name as owner_name,
        d."createdAt" as created_at,
        d."contentExcerpt" as content_excerpt,
        d."mimeType" as mime_type,
        ts_rank(
          setweight(to_tsvector('english', COALESCE(d.title, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(d."contentExcerpt", '')), 'B'),
          websearch_to_tsquery('english', ${query})
        ) as rank
      FROM "Document" d
      JOIN "User" u ON d."ownerId" = u.id
      WHERE 
        d."deletedAt" IS NULL
        AND (
          CASE 
            WHEN d.visibility = 'PRIVATE' THEN d."ownerId" = ${userId}
            WHEN d.visibility = 'DEPARTMENT' THEN d."requirementId" IS NOT NULL
            ELSE true
          END
        )
        AND (
          to_tsvector('english', COALESCE(d.title, '')) ||
          to_tsvector('english', COALESCE(d."contentExcerpt", ''))
        ) @@ websearch_to_tsquery('english', ${query})
      ORDER BY rank DESC
      LIMIT ${take} OFFSET ${skip}
    `,
    prisma.comment.findMany({
      where: {
        content: { contains: query, mode: 'insensitive' },
        document: docBaseWhere,
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true } },
        document: { select: { id: true, title: true } },
      },
    }).catch(() => []),
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "Document" d
      WHERE 
        d."deletedAt" IS NULL
        AND (
          CASE 
            WHEN d.visibility = 'PRIVATE' THEN d."ownerId" = ${userId}
            WHEN d.visibility = 'DEPARTMENT' THEN d."requirementId" IS NOT NULL
            ELSE true
          END
        )
        AND (
          to_tsvector('english', COALESCE(d.title, '')) ||
          to_tsvector('english', COALESCE(d."contentExcerpt", ''))
        ) @@ websearch_to_tsquery('english', ${query})
    `,
  ]);

  const formattedDocuments = documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    visibility: doc.visibility,
    ownerName: doc.owner_name,
    createdAt: doc.created_at,
    contentExcerpt: doc.content_excerpt,
    mimeType: doc.mime_type,
    relevanceScore: doc.rank,
  }));

  const total = Number(totalResult[0]?.count || 0);

  return {
    data: {
      documents: formattedDocuments,
      comments,
      ...getPaginationMeta(total, page, limit),
    },
  };
}

async function basicSearch(params: {
  query: string;
  docBaseWhere: Prisma.DocumentWhereInput;
  skip: number;
  take: number;
  page: number;
  limit: number;
}) {
  const { query, docBaseWhere, skip, take, page, limit } = params;

  const documentWhere: Prisma.DocumentWhereInput = {
    AND: [
      docBaseWhere,
      {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { contentExcerpt: { contains: query, mode: 'insensitive' } },
        ],
      },
    ],
  };

  const [documents, comments, total] = await Promise.all([
    prisma.document.findMany({
      where: documentWhere,
      skip,
      take,
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
      where: {
        content: { contains: query, mode: 'insensitive' },
        document: docBaseWhere,
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { name: true } },
        document: { select: { title: true } },
      },
    }),
    prisma.document.count({ where: documentWhere }),
  ]);

  const formattedDocuments = documents.map((doc: any) => ({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    visibility: doc.visibility,
    ownerName: doc.owner.name,
    createdAt: doc.createdAt,
    contentExcerpt: doc.contentExcerpt,
    mimeType: doc.mimeType,
    relevanceScore: 0,
  }));

  return {
    data: {
      documents: formattedDocuments,
      comments,
      ...getPaginationMeta(total, page, limit),
      page,
      pages: Math.ceil(total / limit),
    },
  };
}
