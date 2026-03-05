import { prisma } from '@/lib/prisma';

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
