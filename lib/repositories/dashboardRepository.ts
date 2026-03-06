import { prisma } from '@/lib/prisma';

export async function getDashboardStats() {
  try {
    const [userCount, documentCount, departmentCount, requirementCount] = await Promise.all([
      prisma.user.count().catch(err => { console.error('User count error:', err); throw err; }),
      prisma.document.count({ where: { deletedAt: null } }).catch(err => { console.error('Document count error:', err); throw err; }),
      prisma.department.count().catch(err => { console.error('Department count error:', err); throw err; }),
      prisma.requirement.count().catch(err => { console.error('Requirement count error:', err); throw err; }),
    ]);

    return {
      stats: {
        userCount,
        documentCount,
        departmentCount,
        requirementCount,
      },
    };
  } catch (error) {
    console.error('Dashboard stats error:', error);
    throw error;
  }
}
