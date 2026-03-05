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
  const { data, error, mutate, isLoading } = useSWR<Comment[]>(
    documentId ? `/api/documents/${documentId}/comment` : null,
    fetcher
  );

  return {
    comments: data ?? [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function buildCommentTree(comments: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];

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
