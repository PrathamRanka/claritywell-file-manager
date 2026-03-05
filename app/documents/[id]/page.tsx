'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useDocument } from '@/hooks/useDocument';
import { useComments, buildCommentTree } from '@/hooks/useComments';
import { LoadingSpinner } from '@/components/ui';
import { RichTextEditor } from '@/components/features/documents/RichTextEditor';
import { DocumentHeader } from '@/components/features/documents/DocumentHeader';
import { CommentsSection } from '@/components/features/documents/CommentsSection';
import { ShareModal } from '@/components/features/documents/ShareModal';

export default function DocumentPage({ params }: { params: { id: string } }) {
  const documentId = params.id;
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const { document, mutate: mutateDocument } = useDocument(documentId);
  const { comments, mutate: mutateComments, isLoading: commentsLoading } = useComments(documentId);

  const handleContentUpdate = async (content: string) => {
    setSaveStatus('saving');
    
    // Debounced save
    const timeout = setTimeout(async () => {
      try {
        await fetch(`/api/documents/${documentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentHtml: content }),
        });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 1000);
    
    return () => clearTimeout(timeout);
  };

  const handleAddComment = async (content: string, parentId?: string) => {
    try {
      await fetch(`/api/documents/${documentId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentCommentId: parentId }),
      });

      mutateComments();
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
      throw new Error('Failed to add comment');
    }
  };

  const handleShare = async () => {
    toast.success('Sharing updated');
    setShareModalOpen(false);
  };

  const handleDownload = () => {
    if (document?.signedUrl) {
      window.open(document.signedUrl, '_blank');
    } else {
      toast.error('Download URL not available');
    }
  };

  if (!document) {
    return <LoadingSpinner message="Loading document..." />;
  }

  const commentTree = buildCommentTree(comments || []);

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Editor area */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
        <DocumentHeader
          document={document}
          saveStatus={saveStatus}
          onShare={() => setShareModalOpen(true)}
          onDownload={handleDownload}
        />

        {/* Editor content */}
        <div className="flex-1 overflow-auto p-6">
          {document.type === 'PDF' && document.signedUrl ? (
            <div className="h-full">
              <iframe
                src={document.signedUrl}
                className="w-full h-full border border-border rounded-lg"
                title={document.title}
              />
            </div>
          ) : document.type === 'IMAGE' && document.signedUrl ? (
            <div className="flex items-center justify-center h-full">
              <img
                src={document.signedUrl}
                alt={document.title}
                className="max-w-full max-h-full object-contain rounded-lg border border-border"
              />
            </div>
          ) : document.type === 'PDF' && !document.signedUrl ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p className="mb-2">⚠️ File upload is simulated</p>
                <p className="text-sm">The PDF was not actually uploaded to storage.</p>
                <p className="text-sm">In production, files would be uploaded to S3 and displayed here.</p>
              </div>
            </div>
          ) : document.canEdit ? (
            <RichTextEditor
              content={document.content || ''}
              editable={document.canEdit}
              onUpdate={handleContentUpdate}
            />
          ) : (
            <div
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: document.content || '<p>No content</p>' }}
            />
          )}
        </div>
      </div>

      {/* Comments sidebar */}
      <div className="w-full md:w-[380px] flex flex-col bg-surface">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display text-lg font-bold">Comments</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <CommentsSection
            comments={commentTree}
            onAddComment={handleAddComment}
            isLoading={commentsLoading}
          />
        </div>
      </div>

      {/* Share modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onShare={handleShare}
      />
    </div>
  );
}
