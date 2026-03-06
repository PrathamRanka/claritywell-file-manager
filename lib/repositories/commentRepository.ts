import { prisma } from '@/lib/prisma';

export async function listComments(documentId: string, skip: number, limit: number) {
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

  const topLevelIds = topLevelComments.map(c => c.id);
  if (topLevelIds.length === 0) {
    return topLevelComments;
  }

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

  return [...topLevelComments, ...replies];
}

export function countComments(documentId: string) {
  return prisma.comment.count({ where: { documentId } });
}

export function findComment(id: string) {
  return prisma.comment.findUnique({
    where: { id },
    select: {
      id: true,
      content: true,
      documentId: true,
      parentCommentId: true,
      authorId: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
    },
  });
}

export function createComment(data: {
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
