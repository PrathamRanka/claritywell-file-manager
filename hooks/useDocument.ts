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
