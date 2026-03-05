import { prisma } from '@/lib/prisma';

/**
 * Lists all users with pagination and department membership details.
 * Logic copied verbatim from users/route.ts.
 */
export async function listUsers(skip: number, limit: number) {
  return prisma.user.findMany({
    take: limit,
    skip,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      departmentMemberships: {
        include: {
          department: { select: { name: true } },
        },
      },
    },
  });
}

/**
 * Counts total users.
 */
export async function countUsers() {
  return prisma.user.count();
}

/**
 * Updates a user's role or name. Logic copied verbatim from users/[id]/route.ts.
 */
export async function updateUser(id: string, data: { role?: string; name?: string }) {
  return prisma.user.update({
    where: { id },
    data: data as any,
    select: { id: true, name: true, role: true },
  });
}
