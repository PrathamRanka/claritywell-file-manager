import useSWR from 'swr';
import { fetcher } from '@/lib/utils/api';

export interface Requirement {
  id: string;
  clientName: string;
  dueDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  department: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
}

export function useRequirement(requirementId: string) {
  const { data, error, mutate, isLoading } = useSWR<Requirement>(
    requirementId ? `/api/requirements/${requirementId}` : null,
    fetcher
  );

  return {
    requirement: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useRequirements() {
  const { data, error, mutate, isLoading } = useSWR<any>('/api/requirements', fetcher);

  const requirements =
    data?.data?.requirements ?? data?.requirements ?? data ?? [];

  return {
    requirements,
    isLoading,
    isError: error,
    mutate,
  };
}
