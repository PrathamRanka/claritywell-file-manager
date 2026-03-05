import { prisma } from '@/lib/prisma';

export async function getUserDepartmentIds(userId: string): Promise<string[]> {
  const memberships = await prisma.departmentMember.findMany({
    where: { userId },
    select: { departmentId: true },
  });
  return memberships.map((m: any) => m.departmentId);
}
