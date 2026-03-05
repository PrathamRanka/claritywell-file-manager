import { useState, useEffect } from 'react';
import useSWR from 'swr';

export interface AuditLogEntry {
  id: string;
  action: string;
  userId: string;
  documentId: string | null;
  folderId: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

interface FetchOptions {
  action?: string;
  userId?: string;
  documentId?: string;
  page?: number;
  limit?: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAuditLogs(options: FetchOptions = {}) {
  const params = new URLSearchParams();

  if (options.action) params.append('action', options.action);
  if (options.userId) params.append('userId', options.userId);
  if (options.documentId) params.append('documentId', options.documentId);
  if (options.page) params.append('page', String(options.page));
  if (options.limit) params.append('limit', String(options.limit));

  const url = `/api/audit-log?${params.toString()}`;

  const { data, error, mutate, isLoading } = useSWR<{
    data: {
      logs: AuditLogEntry[];
      total: number;
      page: number;
      pages: number;
    };
    error: string | null;
  }>(url, fetcher);

  return {
    logs: data?.data?.logs || [],
    total: data?.data?.total || 0,
    page: data?.data?.page || 1,
    pages: data?.data?.pages || 1,
    error: error || data?.error,
    isLoading,
    mutate,
  };
}
