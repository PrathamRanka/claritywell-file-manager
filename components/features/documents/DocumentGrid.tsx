'use client';

import Link from 'next/link';
import { FileText, MoreVertical } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { EmptyState } from '@/components/ui';
import { Document } from '@/hooks/useDocument';

interface DocumentGridProps {
  documents: Document[];
  isLoading?: boolean;
  onContextMenu?: (e: React.MouseEvent, documentId: string) => void;
}

export function DocumentGrid({ documents, isLoading, onContextMenu }: DocumentGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-4 space-y-3">
            <div className="h-6 shimmer rounded w-3/4" />
            <div className="h-4 shimmer rounded w-full" />
            <div className="h-4 shimmer rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No documents yet"
        description="Upload or create a document to get started"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="group bg-surface border border-border rounded-lg hover:shadow-md transition-all overflow-hidden"
          onContextMenu={onContextMenu ? (e) => onContextMenu(e, doc.id) : undefined}
        >
          <Link href={`/documents/${doc.id}`} className="block p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="w-5 h-5 text-accent flex-shrink-0" />
                <h3 className="font-medium truncate">{doc.title}</h3>
              </div>
              {onContextMenu && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onContextMenu(e, doc.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>By {doc.owner.name}</p>
              <p>{formatRelativeTime(doc.createdAt)}</p>
              {doc.type && (
                <span className="inline-block px-2 py-0.5 bg-muted rounded text-xs">
                  {doc.type}
                </span>
              )}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
