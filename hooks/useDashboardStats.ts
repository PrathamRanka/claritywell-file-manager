import useSWR from 'swr';
import { fetcher } from '@/lib/utils/api';

export interface DashboardStats {
  totalUsers: number;
  totalDocuments: number;
  totalDepartments: number;
  totalRequirements?: number;
}

export function useDashboardStats() {
  const { data, error, isLoading } = useSWR<DashboardStats>(
    '/api/dashboard/stats',
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  return {
    stats: data,
    isLoading,
    isError: error,
  };
}
