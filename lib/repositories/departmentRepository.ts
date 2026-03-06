import { prisma } from '@/lib/prisma';

export async function listDepartments(skip: number, limit: number) {
  return prisma.department.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip,
    select: { 
      id: true, 
      name: true, 
      createdAt: true,
      members: {
        select: {
          userId: true,
          departmentId: true,
          joinedAt: true,
          user: { select: { id: true, name: true, email: true, role: true } }
        }
      }
    },
  });
}

export async function createDepartment(name: string) {
  return prisma.department.create({
    data: { name },
    select: { id: true, name: true, createdAt: true },
  });
}

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

export async function addDepartmentMember(userId: string, departmentId: string) {
  return prisma.departmentMember.create({
    data: { userId, departmentId },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
}

export async function removeDepartmentMember(userId: string, departmentId: string) {
  return prisma.departmentMember.delete({
    where: { userId_departmentId: { userId, departmentId } },
  });
}

export async function updateDepartment(id: string, name: string) {
  return prisma.department.update({
    where: { id },
    data: { name },
    select: { id: true, name: true, createdAt: true },
  });
}

export async function deleteDepartment(id: string) {
  return prisma.$transaction([
    prisma.departmentMember.deleteMany({ where: { departmentId: id } }),
    prisma.department.delete({ where: { id } }),
  ]);
}
