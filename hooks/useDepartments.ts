import useSWR from 'swr';
import { fetcher } from '@/lib/utils/api';

export interface Department {
  id: string;
  name: string;
  members: Array<{ id: string; name: string; email: string }>;
}

export function useDepartments(enabled = true) {
  const { data, error, mutate, isLoading } = useSWR<any>(enabled ? '/api/departments' : null, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  // Safely extract departments array from various response formats
  let rawDepartments = [];
  if (data) {
    if (Array.isArray(data)) {
      rawDepartments = data;
    } else if (data.data?.departments && Array.isArray(data.data.departments)) {
      rawDepartments = data.data.departments;
    } else if (data.departments && Array.isArray(data.departments)) {
      rawDepartments = data.departments;
    }
  }

  const departments: Department[] = rawDepartments.map((d: any) => ({
    id: d.id,
    name: d.name,
    members: Array.isArray(d.members) ? d.members : [],
  }));

  return {
    departments,
    isLoading,
    isError: error,
    mutate,
  };
}
