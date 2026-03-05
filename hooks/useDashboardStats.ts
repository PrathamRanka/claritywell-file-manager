import useSWR from 'swr';
import { fetcher } from '@/lib/utils/api';

export interface DashboardStats {
  totalUsers: number;
  totalDocuments: number;
  totalDepartments: number;
}

export function useDashboardStats() {
  const { data, error, isLoading } = useSWR<DashboardStats>(
    '/api/dashboard/stats',
    fetcher
  );

  return {
    stats: data,
    isLoading,
    isError: error,
  };
}
