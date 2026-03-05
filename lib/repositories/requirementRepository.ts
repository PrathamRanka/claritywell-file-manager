import { prisma } from '@/lib/prisma';
import { Prisma } from '@/prisma/generated';

/**
 * Finds a requirement by ID with full relations.
 * Logic copied verbatim from requirements/[id]/route.ts.
 */
export async function findRequirement(id: string) {
  return prisma.requirement.findUnique({
    where: { id },
    include: {
      department: true,
      createdBy: { select: { name: true } },
      documents: {
        where: { deletedAt: null },
        select: { id: true, title: true, type: true, visibility: true },
      },
    },
  });
}

/**
 * Lists requirements with an optional permission-scoped where clause.
 * Logic copied verbatim from requirements/route.ts.
 */
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

/**
 * Creates a new requirement. Logic copied from requirements/route.ts.
 */
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

/**
 * Hard-deletes a requirement. Logic from requirements/[id]/route.ts DELETE.
 */
export async function deleteRequirement(id: string) {
  return prisma.requirement.delete({ where: { id } });
}

/**
 * Finds a department by ID (used to validate departmentId on create).
 */
export async function findDepartment(id: string) {
  return prisma.department.findUnique({ where: { id } });
}
