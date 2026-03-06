import { prisma } from '@/lib/prisma';

export async function findRequirement(id: string) {
  return prisma.requirement.findUnique({
    where: { id },
    select: {
      id: true,
      clientName: true,
      dueDate: true,
      priority: true,
      status: true,
      createdAt: true,
      departmentId: true,
      createdById: true,
      department: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      documents: {
        where: { deletedAt: null },
        select: { id: true, title: true, type: true, visibility: true },
      },
    },
  });
}

export async function listRequirements(whereClause: any, skip: number, limit: number) {
  return prisma.requirement.findMany({
    where: whereClause,
    take: limit,
    skip,
    orderBy: { dueDate: 'asc' },
    select: {
      id: true,
      clientName: true,
      dueDate: true,
      priority: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function createRequirement(data: {
  clientName: string;
  dueDate: Date;
  priority: string;
  departmentId: string;
  createdById: string;
}) {
  return prisma.requirement.create({
    data: data as any,
    select: {
      id: true,
      clientName: true,
      dueDate: true,
      priority: true,
      departmentId: true,
    },
  });
}

export async function deleteRequirement(id: string) {
  return prisma.requirement.delete({ where: { id } });
}

export async function findDepartment(id: string) {
  return prisma.department.findUnique({ where: { id }, select: { id: true, name: true } });
}
