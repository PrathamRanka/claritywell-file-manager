'use client';

import { useState } from 'react';
import { Send, Reply } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { Button, EmptyState } from '@/components/ui';
import { Comment } from '@/hooks/useComments';

interface CommentsSectionProps {
  comments: Comment[];
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  isLoading?: boolean;
}

export function CommentsSection({ comments, onAddComment, isLoading }: CommentsSectionProps) {
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(commentText, replyTo || undefined);
      setCommentText('');
      setReplyTo(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={depth > 0 ? 'ml-8 mt-4' : 'mt-4'}>
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <span className="font-medium">{comment.author.name}</span>
            <span className="text-sm text-muted-foreground ml-2">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          {depth < 2 && (
            <button
              onClick={() => setReplyTo(comment.id)}
              className="text-sm text-accent hover:text-accent-hover flex items-center gap-1"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
          )}
        </div>
        <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
      </div>
      {comment.replies && comment.replies.map((reply) => renderComment(reply, depth + 1))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Add comment form */}
      <div className="space-y-3">
        {replyTo && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Reply className="w-4 h-4" />
            <span>Replying to comment</span>
            <button
              onClick={() => setReplyTo(null)}
              className="text-accent hover:text-accent-hover"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-4 py-3 rounded-lg border border-border bg-surface focus:border-accent focus-ring resize-none min-h-[100px]"
          />
          <Button
            onClick={handleSubmit}
            icon={Send}
            disabled={!commentText.trim() || isSubmitting}
            isLoading={isSubmitting}
          >
            Send
          </Button>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading comments...</div>
      ) : comments.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No comments yet"
          description="Be the first to add a comment"
        />
      ) : (
        <div className="space-y-2">{comments.map((comment) => renderComment(comment))}</div>
      )}
    </div>
  );
}
