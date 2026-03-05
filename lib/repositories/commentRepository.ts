import { prisma } from '@/lib/prisma';

/**
 * Lists top-level comments for a document, paginated.
 * Logic copied verbatim from documents/[id]/route.ts GET.
 */
export async function listComments(documentId: string, skip: number, limit: number) {
  return prisma.comment.findMany({
    where: { documentId, parentCommentId: null },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip,
    select: {
      id: true,
      content: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
    },
  });
}

/**
 * Finds a comment by ID. Used to validate parentCommentId on create.
 */
export async function findComment(id: string) {
  return prisma.comment.findUnique({ where: { id } });
}

/**
 * Creates a new comment. Logic copied verbatim from documents/[id]/comment/route.ts.
 */
export async function createComment(data: {
  content: string;
  authorId: string;
  documentId: string;
  parentCommentId?: string | null;
}) {
  return prisma.comment.create({
    data,
    select: {
      id: true,
      content: true,
      documentId: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
    },
  });
}
