'use client';

import Link from 'next/link';
import { FileText, MessageSquare, User, Calendar } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { highlightText } from '@/lib/utils/formatters';
import { EmptyState } from '@/components/ui';
import { Inbox } from 'lucide-react';

// Flexible document type that handles both API shapes
interface APIDocument {
  id: string;
  title: string;
  type: string;
  // API returns flat ownerName, component expected nested owner.name
  ownerName?: string;
  owner?: { id?: string; name: string };
  createdAt: string | Date;
  excerpt?: string;
  contentExcerpt?: string;
}

// Flexible comment type that handles both API shapes
interface APIComment {
  id: string;
  content: string;
  documentId?: string;
  document?: { id?: string; title?: string };
  documentTitle?: string;
  author: { id?: string; name: string };
  createdAt: string | Date;
  excerpt?: string;
}

interface SearchResult {
  documents?: APIDocument[];
  comments?: APIComment[];
}

interface SearchResultsProps {
  results: SearchResult | null;
  query: string;
  isLoading: boolean;
}

export function SearchResults({ results, query, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-6 shimmer rounded w-32" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-4 space-y-2">
              <div className="h-5 shimmer rounded w-3/4" />
              <div className="h-4 shimmer rounded w-full" />
              <div className="h-4 shimmer rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const docs = results?.documents ?? [];
  const comments = results?.comments ?? [];
  const totalResults = docs.length + comments.length;

  if (results && totalResults === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No results found"
        description="Try searching with different keywords"
      />
    );
  }

  if (!results || totalResults === 0) return null;

  return (
    <div className="space-y-8">
      {/* Documents section */}
      {docs.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-accent" />
            <h2 className="font-display text-xl font-bold">
              Documents
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({docs.length})
              </span>
            </h2>
          </div>

          <div className="space-y-3">
            {docs.map((doc) => {
              // Handle both API shapes
              const ownerName = doc.owner?.name ?? doc.ownerName ?? 'Unknown';
              const excerpt = doc.excerpt ?? doc.contentExcerpt ?? '';
              const createdAt = typeof doc.createdAt === 'string' ? doc.createdAt : new Date(doc.createdAt).toISOString();
              return (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="block bg-surface border border-border rounded-lg p-4 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground group-hover:text-accent transition-colors mb-1">
                        {highlightText(doc.title, query)}
                      </h3>
                      {excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {highlightText(excerpt, query)}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {ownerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatRelativeTime(createdAt)}
                        </span>
                        <span className="px-2 py-0.5 bg-muted rounded text-xs">
                          {doc.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Comments section */}
      {comments.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-accent" />
            <h2 className="font-display text-xl font-bold">
              Comments
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({comments.length})
              </span>
            </h2>
          </div>

          <div className="space-y-3">
            {comments.map((comment) => {
              const docId = comment.documentId ?? comment.document?.id ?? '';
              const docTitle = comment.documentTitle ?? comment.document?.title ?? 'Document';
              const excerpt = comment.excerpt ?? comment.content ?? '';
              const createdAt = typeof comment.createdAt === 'string' ? comment.createdAt : new Date(comment.createdAt).toISOString();
              return (
                <Link
                  key={comment.id}
                  href={`/documents/${docId}`}
                  className="block bg-surface border border-border rounded-lg p-4 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground group-hover:text-accent transition-colors mb-1">
                        {docTitle}
                      </h3>
                      <p className="text-sm text-foreground/90 line-clamp-2 mb-2">
                        {highlightText(excerpt, query)}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {comment.author?.name ?? 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatRelativeTime(createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}


