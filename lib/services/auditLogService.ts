import {
  listAuditLogs,
  countAuditLogs,
} from '@/lib/repositories/auditLogRepository';

/**
 * Lists audit logs with optional filters, paginated (admin-only check at route level).
 * Logic copied verbatim from audit-log/route.ts.
 */
export async function listAuditLogsService(params: {
  userId?: string | null;
  documentId?: string | null;
  action?: string | null;
  page: number;
  limit: number;
}) {
  const { userId, documentId, action, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (userId) where.userId = userId;
  if (documentId) where.documentId = documentId;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    listAuditLogs(where, skip, limit),
    countAuditLogs(where),
  ]);

  return {
    data: {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  };
}
