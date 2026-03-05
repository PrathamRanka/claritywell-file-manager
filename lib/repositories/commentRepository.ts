import { prisma } from '@/lib/prisma';

export async function listComments(documentId: string, skip: number, limit: number) {
  // Fetch all comments for the document to build the tree structure
  // Only paginate the top-level comments
  const topLevelComments = await prisma.comment.findMany({
    where: { documentId, parentCommentId: null },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip,
    select: {
      id: true,
      content: true,
      createdAt: true,
      parentCommentId: true,
      author: { select: { id: true, name: true } },
    },
  });

  // Get all reply comments for the top-level comments
  const topLevelIds = topLevelComments.map(c => c.id);
  const replies = await prisma.comment.findMany({
    where: { 
      documentId,
      parentCommentId: { in: topLevelIds },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      content: true,
      createdAt: true,
      parentCommentId: true,
      author: { select: { id: true, name: true } },
    },
  });

  // Combine top-level and replies
  return [...topLevelComments, ...replies];
}

export async function countComments(documentId: string) {
  return prisma.comment.count({ where: { documentId } });
}

export async function findComment(id: string) {
  return prisma.comment.findUnique({ where: { id } });
}

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
