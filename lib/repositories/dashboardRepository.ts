import { prisma } from '@/lib/prisma';

export async function getDashboardStats() {
  try {
    const [userCount, documentCount, departmentCount, requirementCount, recentDocuments, recentActivity] = await Promise.all([
      prisma.user.count().catch(err => { console.error('User count error:', err); throw err; }),
      prisma.document.count({ where: { deletedAt: null } }).catch(err => { console.error('Document count error:', err); throw err; }),
      prisma.department.count().catch(err => { console.error('Department count error:', err); throw err; }),
      prisma.requirement.count().catch(err => { console.error('Requirement count error:', err); throw err; }),
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
      }).catch(err => { console.error('Recent documents error:', err); throw err; }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { name: true, email: true } },
        },
      }).catch(err => { console.error('Recent activity error:', err); throw err; }),
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
  } catch (error) {
    console.error('Dashboard stats error:', error);
    throw error;
  }
}
