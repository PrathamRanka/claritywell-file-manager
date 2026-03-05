import useSWR from 'swr';
import { fetcher } from '@/lib/utils/api';

export interface Department {
  id: string;
  name: string;
  members: Array<{ id: string; name: string; email: string }>;
}

export function useDepartments() {
  const { data, error, mutate, isLoading } = useSWR<any>('/api/departments', fetcher);

  const departments: Department[] = (
    data?.data?.departments ??
    data?.departments ??
    data ??
    []
  ).map((d: any) => ({
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
