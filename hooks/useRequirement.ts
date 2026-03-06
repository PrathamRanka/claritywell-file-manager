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
  const { data, error, mutate, isLoading } = useSWR<any>(
    requirementId ? `/api/requirements/${requirementId}` : null,
    fetcher
  );

  // Unwrap nested API response: { data: { requirement: {...} }, error: null }
  let requirement: Requirement | undefined = undefined;
  if (data?.data?.requirement) {
    requirement = data.data.requirement;
  } else if (data?.requirement) {
    requirement = data.requirement;
  } else if (data?.id) {
    requirement = data;
  }

  return {
    requirement,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useRequirements(enabled = true) {
  const { data, error, mutate, isLoading } = useSWR<any>(enabled ? '/api/requirements' : null, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  // Safely extract requirements array from various response formats
  let requirements = [];
  if (data) {
    if (Array.isArray(data)) {
      requirements = data;
    } else if (data.data?.requirements && Array.isArray(data.data.requirements)) {
      requirements = data.data.requirements;
    } else if (data.requirements && Array.isArray(data.requirements)) {
      requirements = data.requirements;
    }
  }

  return {
    requirements,
    isLoading,
    isError: error,
    mutate,
  };
}
