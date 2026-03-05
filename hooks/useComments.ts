import useSWR from 'swr';
import { fetcher } from '@/lib/utils/api';

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
  parentId: string | null;
  replies?: Comment[];
}

export function useComments(documentId: string) {
  const { data, error, mutate, isLoading } = useSWR<any>(
    documentId ? `/api/documents/${documentId}/comment` : null,
    fetcher
  );

  // Handle different response formats
  let comments: Comment[] = [];
  if (data?.data?.comments && Array.isArray(data.data.comments)) {
    comments = data.data.comments;
  } else if (data?.comments && Array.isArray(data.comments)) {
    comments = data.comments;
  } else if (Array.isArray(data)) {
    comments = data;
  }

  return {
    comments,
    isLoading,
    isError: error,
    mutate,
  };
}

export function buildCommentTree(comments: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];

  // Ensure comments is an array
  if (!Array.isArray(comments)) {
    return [];
  }

  comments.forEach((comment) => {
    map.set(comment.id, { ...comment, replies: [] });
  });

  comments.forEach((comment) => {
    const node = map.get(comment.id)!;
    if (comment.parentId) {
      const parent = map.get(comment.parentId);
      if (parent) {
        parent.replies!.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}
