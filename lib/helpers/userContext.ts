import { prisma } from '@/lib/prisma';

/**
 * Fetches all department IDs the given user belongs to.
 * Copied verbatim from the repeated pattern in documents, requirements,
 * search, thumbnail, and folder routes.
 */
export async function getUserDepartmentIds(userId: string): Promise<string[]> {
  const memberships = await prisma.departmentMember.findMany({
    where: { userId },
    select: { departmentId: true },
  });
  return memberships.map((m: any) => m.departmentId);
}
