import useSWR from 'swr';
import { fetcher } from '@/lib/utils/api';

export interface Document {
  id: string;
  title: string;
  content: string;
  type: string;
  visibility: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  requirement?: {
    id: string;
    clientName: string;
  };
  canEdit: boolean;
}

export function useDocument(documentId: string) {
  const { data, error, mutate, isLoading } = useSWR<Document>(
    documentId ? `/api/documents/${documentId}` : null,
    fetcher
  );

  return {
    document: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useDocuments(params?: { requirementId?: string; folderId?: string }) {
  const queryParams = new URLSearchParams();
  if (params?.requirementId) queryParams.set('requirementId', params.requirementId);
  if (params?.folderId) queryParams.set('folderId', params.folderId);

  const queryString = queryParams.toString();
  const url = `/api/documents${queryString ? `?${queryString}` : ''}`;

  const { data, error, mutate, isLoading } = useSWR<any>(url, fetcher);

  return {
    documents: data?.data ?? data ?? { items: [], total: 0 },
    isLoading,
    isError: error,
    mutate,
  };
}
