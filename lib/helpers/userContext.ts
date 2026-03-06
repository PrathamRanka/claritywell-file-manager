import { prisma } from '@/lib/prisma';
import { getRequestCache } from '@/lib/utils/route-metrics';

export async function getUserDepartmentIds(userId: string): Promise<string[]> {
  const cache = getRequestCache();
  const cacheKey = `userDepartmentIds:${userId}`;

  if (cache?.has(cacheKey)) {
    return cache.get(cacheKey) as string[];
  }

  const memberships = await prisma.departmentMember.findMany({
    where: { userId },
    select: { departmentId: true },
  });

  const departmentIds = memberships.map((m: any) => m.departmentId);
  cache?.set(cacheKey, departmentIds);

  return departmentIds;
}
