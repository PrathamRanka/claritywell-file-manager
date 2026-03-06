import useSWR from 'swr';
import { fetcher } from '@/lib/utils/api';

export interface Folder {
  id: string;
  name: string;
  parentId?: string | null;
  visibility: string;
  parent?: Folder;
  documentCount?: number;
  createdAt: string;
  children?: Folder[];
}

export function useFolder(folderId: string) {
  const { data, error, mutate, isLoading } = useSWR<any>(
    folderId ? `/api/folders/${folderId}` : null,
    fetcher
  );

  const folder = data?.data?.folder ?? data?.folder ?? data;

  return {
    folder,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useFolders(page = 1, limit = 50) {
  const { data, error, mutate, isLoading } = useSWR<any>(
    `/api/folders?page=${page}&limit=${limit}`,
    fetcher
  );

  // Handle different API response structures
  let folders: Folder[] = [];
  if (Array.isArray(data)) {
    folders = data;
  } else if (data?.folders && Array.isArray(data.folders)) {
    folders = data.folders;
  } else if (data?.data?.folders && Array.isArray(data.data.folders)) {
    folders = data.data.folders;
  }

  const total = data?.total || data?.data?.total || folders.length;
  const totalPages = data?.totalPages || data?.data?.totalPages || 1;

  return {
    folders,
    total,
    page,
    totalPages,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useFolderItems(folderId: string, page = 1, limit = 12) {
  const { data, error, mutate, isLoading } = useSWR<any>(
    folderId ? `/api/folders/${folderId}/items?page=${page}&limit=${limit}` : null,
    fetcher
  );

  const documents = data?.data ?? data ?? { items: [], total: 0 };
  const items = Array.isArray(documents.items) ? documents.items : [];
  const total = typeof documents.total === 'number' ? documents.total : items.length;

  return {
    items,
    total,
    isLoading,
    isError: error,
    mutate,
  };
}
