import useSWR from 'swr';
import { fetcher } from '@/lib/utils/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  departments: Array<{ id: string; name: string }>;
}

export function useUsers() {
  const { data, error, mutate, isLoading } = useSWR<any>('/api/users', fetcher);

  const users: User[] = (data?.data?.users ?? data?.users ?? data ?? []).map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    departments: (u.departments ?? u.departmentMemberships ?? []).map((m: any) => ({
      id: m.id ?? m.departmentId ?? m.department?.id ?? '',
      name: m.name ?? m.department?.name ?? '',
    })),
  }));

  return {
    users,
    isLoading,
    isError: error,
    mutate,
  };
}
