import { prisma } from '@/lib/prisma';
import { getVisibleDocumentsWhereClause } from '@/lib/permissions';
import { getUserDepartmentIds } from '@/lib/helpers/userContext';
import { Prisma } from '@prisma/client';

/**
 * Enhanced search using PostgreSQL full-text search
 * Supports ranking by relevance and faster query performance
 */
export async function advancedSearchService(params: {
  userId: string;
  userRole: string;
  q: string;
  page: number;
  limit?: number;
}) {
  const { userId, userRole, q, page, limit = 20 } = params;
  const skip = (page - 1) * limit;

  if (!q || q.trim().length === 0) {
    return { data: { documents: [], comments: [], total: 0 } };
  }

  const userDepartmentIds = await getUserDepartmentIds(userId);
  const docBaseWhere: Prisma.DocumentWhereInput = getVisibleDocumentsWhereClause(
    userId,
    userRole,
    userDepartmentIds
  );

  // Sanitize query for PostgreSQL websearch_to_tsquery (supports quotes, OR, -, etc.)
  const sanitizedQuery = q.trim();

  if (!sanitizedQuery) {
    return { data: { documents: [], comments: [], total: 0 } };
  }

  try {
    // Use raw SQL for PostgreSQL full-text search with ranking
    // This allows us to search using tsvector and tsquery for better performance
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
            websearch_to_tsquery('english', ${sanitizedQuery})
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
          ) @@ websearch_to_tsquery('english', ${sanitizedQuery})
        ORDER BY rank DESC
        LIMIT ${limit} OFFSET ${skip}
      `,

      // Search in comments
      prisma.comment.findMany({
        where: {
          AND: [
            { content: { contains: sanitizedQuery, mode: 'insensitive' } },
            {
              document: {
                AND: [
                  docBaseWhere,
                  {
                    OR: [
                      { title: { contains: q, mode: 'insensitive' } },
                      { contentExcerpt: { contains: q, mode: 'insensitive' } },
                    ],
                  },
                ],
              },
            },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true } },
          document: { select: { id: true, title: true } },
        },
      }).catch(() => []), // Fallback if full-text search not available

      // Count total documents matching search
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
          ) @@ websearch_to_tsquery('english', ${sanitizedQuery})
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
        comments: comments || [],
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Advanced search error, falling back to basic search:', error);
    // Fallback to basic search if advanced search fails
    return searchServiceBasic(params);
  }
}

/**
 * Basic fallback search using simple ILIKE queries
 */
async function searchServiceBasic(params: {
  userId: string;
  userRole: string;
  q: string;
  page: number;
  limit?: number;
}) {
  const { userId, userRole, q, page, limit = 20 } = params;
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

  const [documents, comments, total] = await Promise.all([
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
      where: {
        AND: [
          { content: { contains: q, mode: 'insensitive' } },
          { document: docBaseWhere },
        ],
      },
      skip,
      take: limit,
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
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  };
}
