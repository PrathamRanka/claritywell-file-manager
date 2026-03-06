import { prisma } from '@/lib/prisma';

export async function createAuditLog(
  data: {
    action: string;
    userId: string;
    documentId?: string;
    metadata?: object;
  },
  tx?: any
) {
  const client = tx ?? prisma;
  return client.auditLog.create({ data: data as any });
}

export async function listAuditLogs(where: any, skip: number, limit: number) {
  return prisma.auditLog.findMany({
    where,
    take: limit,
    skip,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      action: true,
      metadata: true,
      createdAt: true,
      documentId: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function countAuditLogs(where: any) {
  return prisma.auditLog.count({ where });
}
