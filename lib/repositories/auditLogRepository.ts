import { prisma } from '@/lib/prisma';

/**
 * Creates an audit log entry. Accepts an optional transaction client.
 * Logic extracted from every route that writes audit logs.
 */
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

/**
 * Lists audit logs with optional filters, paginated.
 * Logic copied verbatim from audit-log/route.ts.
 */
export async function listAuditLogs(where: any, skip: number, limit: number) {
  return prisma.auditLog.findMany({
    where,
    take: limit,
    skip,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Counts audit logs matching the given where clause.
 */
export async function countAuditLogs(where: any) {
  return prisma.auditLog.count({ where });
}
