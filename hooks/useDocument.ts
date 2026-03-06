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
  signedUrl?: string | null;
  mimeType?: string | null;
}

export function useDocument(documentId: string) {
  const { data, error, mutate, isLoading } = useSWR<any>(
    documentId ? `/api/documents/${documentId}` : null,
    fetcher
  );

  // Extract document from API response structure
  let document: Document | undefined = undefined;
  if (data?.data?.document) {
    document = {
      ...data.data.document,
      content: data.data.document.contentHtml || '',
      signedUrl: data.data.signedUrl || null,
      canEdit: true, // TODO: Get from permissions
    };
  } else if (data?.document) {
    document = {
      ...data.document,
      content: data.document.contentHtml || '',
      signedUrl: data.signedUrl || null,
      canEdit: true,
    };
  } else if (data?.id) {
    document = {
      ...data,
      content: data.contentHtml || '',
      signedUrl: data.signedUrl || null,
      canEdit: true,
    };
  }

  return {
    document,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useDocuments(params?: { requirementId?: string; folderId?: string; page?: number; limit?: number }) {
  const queryParams = new URLSearchParams();
  if (params?.requirementId) queryParams.set('requirementId', params.requirementId);
  if (params?.folderId) queryParams.set('folderId', params.folderId);
  
  queryParams.set('page', (params?.page || 1).toString());
  queryParams.set('limit', (params?.limit || 20).toString());

  const queryString = queryParams.toString();
  const url = `/api/documents${queryString ? `?${queryString}` : ''}`;

  const { data, error, mutate, isLoading } = useSWR<any>(url, fetcher);

  const { items: docs = [], total = 0, page = 1, totalPages = 1 } = data?.data ?? data ?? {};

  return {
    documents: docs,
    total,
    page,
    totalPages,
    isLoading,
    isError: error,
    mutate,
  };
}
