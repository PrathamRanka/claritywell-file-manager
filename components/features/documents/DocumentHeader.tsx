'use client';

import { User, Clock, Tag, Save } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';
import { VisibilityBadge } from './VisibilityBadge';
import { Document } from '@/hooks/useDocument';

interface DocumentHeaderProps {
  document: Document;
  saveStatus: 'saved' | 'saving' | 'error';
  onShare?: () => void;
  onDownload?: () => void;
}

export function DocumentHeader({ document, saveStatus, onShare, onDownload }: DocumentHeaderProps) {
  return (
    <div>
      {/* Toolbar */}
      <div className="border-b border-border bg-surface px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-2 text-muted-foreground">
              <div className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-2 text-success">
              <Save className="w-4 h-4" />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-2 text-destructive">Error saving</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onShare && document.canEdit && (
            <button
              onClick={onShare}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
            >
              Share
            </button>
          )}
          {onDownload && (document.type === 'PDF' || document.type === 'IMAGE') && (
            <button
              onClick={onDownload}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
            >
              Download
            </button>
          )}
        </div>
      </div>

      {/* Document meta */}
      <div className="border-b border-border bg-muted/30 px-6 py-4">
        <h1 className="font-display text-2xl font-bold mb-3">{document.title}</h1>
        <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{document.owner?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{formatDate(document.createdAt)}</span>
          </div>
          {document.requirement?.clientName && (
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span>{document.requirement.clientName}</span>
            </div>
          )}
          <VisibilityBadge visibility={document.visibility as any} />
        </div>
      </div>
    </div>
  );
}
