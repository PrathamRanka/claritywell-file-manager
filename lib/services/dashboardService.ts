import { getDashboardStats } from '@/lib/repositories/dashboardRepository';

export async function dashboardStatsService() {
  const data = await getDashboardStats();
  return { data };
}
