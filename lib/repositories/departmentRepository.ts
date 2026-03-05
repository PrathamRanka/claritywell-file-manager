import { prisma } from '@/lib/prisma';

/**
 * Lists departments with pagination. Logic from departments/route.ts GET.
 */
export async function listDepartments(skip: number, limit: number) {
  return prisma.department.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip,
    select: { id: true, name: true, createdAt: true },
  });
}

/**
 * Creates a new department. Logic from departments/route.ts POST.
 */
export async function createDepartment(name: string) {
  return prisma.department.create({
    data: { name },
    select: { id: true, name: true, createdAt: true },
  });
}

/**
 * Lists members of a department with pagination.
 * Logic from departments/[id]/members/route.ts.
 */
export async function listDepartmentMembers(departmentId: string, skip: number, limit: number) {
  return prisma.departmentMember.findMany({
    where: { departmentId },
    take: limit,
    skip,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
}

/**
 * Removes a user from a department.
 * Logic from departments/[id]/members/[userId]/route.ts DELETE.
 */
export async function removeDepartmentMember(userId: string, departmentId: string) {
  return prisma.departmentMember.delete({
    where: { userId_departmentId: { userId, departmentId } },
  });
}
