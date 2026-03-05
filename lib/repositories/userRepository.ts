import { prisma } from '@/lib/prisma';

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

export async function countUsers() {
  return prisma.user.count();
}

export async function updateUser(id: string, data: { role?: string; name?: string }) {
  return prisma.user.update({
    where: { id },
    data: data as any,
    select: { id: true, name: true, role: true },
  });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({
    where: { id },
    select: { id: true, name: true, email: true },
  });
}
