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
  const { data, error, mutate, isLoading } = useSWR<any>('/api/users', fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  // Safely extract users array from various response formats
  let rawUsers = [];
  if (data) {
    if (Array.isArray(data)) {
      rawUsers = data;
    } else if (data.data?.users && Array.isArray(data.data.users)) {
      rawUsers = data.data.users;
    } else if (data.users && Array.isArray(data.users)) {
      rawUsers = data.users;
    }
  }

  const users: User[] = rawUsers.map((u: any) => ({
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
