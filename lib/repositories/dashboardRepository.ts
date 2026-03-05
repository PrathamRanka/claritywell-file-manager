import { prisma } from '@/lib/prisma';

export async function getDashboardStats() {
  const [userCount, documentCount, departmentCount, requirementCount, recentDocuments, recentActivity] = await Promise.all([
    prisma.user.count(),
    prisma.document.count({ where: { deletedAt: null } }),
    prisma.department.count(),
    prisma.requirement.count(),
    prisma.document.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        createdAt: true,
        owner: { select: { name: true } },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  return {
    stats: {
      userCount,
      documentCount,
      departmentCount,
      requirementCount,
    },
    recentDocuments,
    recentActivity,
  };
}
