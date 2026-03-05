'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
  Bold, Italic, List, ListOrdered, Heading1, Heading2, 
  Save, Share2, Download, User, Clock, Tag, FileText,
  Send, Reply, Lock, Users as UsersIcon, Building2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Document {
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
}

interface Comment {
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

interface ShareModalState {
  isOpen: boolean;
  searchQuery: string;
  selectedUsers: Array<{ id: string; name: string; permission: string }>;
}

export default function DocumentPage({ params }: { params: { id: string } }) {
  const documentId = params.id;
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [shareModal, setShareModal] = useState<ShareModalState>({ 
    isOpen: false, 
    searchQuery: '', 
    selectedUsers: [] 
  });
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const { data: document, mutate: mutateDocument } = useSWR<Document>(
    `/api/documents/${documentId}`,
    fetcher
  );
  const { data: comments, mutate: mutateComments } = useSWR<Comment[]>(
    `/api/documents/${documentId}/comment`,
    fetcher
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: document?.content || '',
    editable: document?.canEdit || false,
    onUpdate: ({ editor }) => {
      setSaveStatus('saving');
      // Debounced save
      const timeout = setTimeout(async () => {
        try {
          await fetch(`/api/documents/${documentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: editor.getHTML() }),
          });
          setSaveStatus('saved');
        } catch {
          setSaveStatus('error');
        }
      }, 1000);
      return () => clearTimeout(timeout);
    },
  });

  useEffect(() => {
    if (editor && document?.content) {
      editor.commands.setContent(document.content);
      editor.setEditable(document.canEdit);
    }
  }, [editor, document]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      await fetch(`/api/documents/${documentId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: commentText, 
          parentId: replyTo 
        }),
      });
      
      setCommentText('');
      setReplyTo(null);
      mutateComments();
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const handleShare = async () => {
    // Implement sharing logic
    toast.success('Sharing updated');
    setShareModal({ isOpen: false, searchQuery: '', selectedUsers: [] });
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'PRIVATE':
        return <Lock className="w-4 h-4" />;
      case 'DEPARTMENT':
        return <Building2 className="w-4 h-4" />;
      case 'SHARED':
        return <UsersIcon className="w-4 h-4" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  const buildCommentTree = (comments: Comment[]): Comment[] => {
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
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className="fade-in">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-accent-foreground">
            {comment.author.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-foreground/90 mb-2">{comment.content}</p>
          <button
            onClick={() => setReplyTo(comment.id)}
            className="text-xs text-accent hover:text-accent-hover font-medium"
          >
            Reply
          </button>

          {replyTo === comment.id && (
            <div className="mt-3 mb-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-accent focus-ring resize-none text-sm"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleAddComment}
                  className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:bg-accent-hover transition-colors"
                >
                  Reply
                </button>
                <button
                  onClick={() => {
                    setReplyTo(null);
                    setCommentText('');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3 pl-4 border-l-2 border-border">
              {comment.replies.map((reply) => renderComment(reply, depth + 1))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!document) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  const commentTree = comments ? buildCommentTree(comments) : [];

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Editor area */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
        {/* Toolbar */}
        <div className="border-b border-border bg-surface px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {document.canEdit && editor && (
              <div className="flex items-center gap-1 border-r border-border pr-3 mr-2">
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-2 rounded-lg transition-colors focus-ring ${
                    editor.isActive('bold') ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  }`}
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-2 rounded-lg transition-colors focus-ring ${
                    editor.isActive('italic') ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  }`}
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`p-2 rounded-lg transition-colors focus-ring ${
                    editor.isActive('heading', { level: 1 }) ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  }`}
                  title="Heading 1"
                >
                  <Heading1 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`p-2 rounded-lg transition-colors focus-ring ${
                    editor.isActive('heading', { level: 2 }) ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  }`}
                  title="Heading 2"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`p-2 rounded-lg transition-colors focus-ring ${
                    editor.isActive('bulletList') ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  }`}
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`p-2 rounded-lg transition-colors focus-ring ${
                    editor.isActive('orderedList') ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  }`}
                  title="Ordered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
              </div>
            )}

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
                <span className="flex items-center gap-2 text-destructive">
                  Error saving
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(document.owner.id === 'currentUserId' || document.canEdit) && (
              <button
                onClick={() => setShareModal({ ...shareModal, isOpen: true })}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            )}
            {(document.type === 'PDF' || document.type === 'IMAGE') && (
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm">
                <Download className="w-4 h-4" />
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
              <span>{document.owner.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(document.createdAt), 'MMM d, yyyy')}</span>
            </div>
            {document.requirement && (
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span>{document.requirement.clientName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              {getVisibilityIcon(document.visibility)}
              <span className="capitalize">{document.visibility.toLowerCase()}</span>
            </div>
          </div>
        </div>

        {/* Editor content */}
        <div className="flex-1 overflow-auto p-6">
          {document.canEdit ? (
            <EditorContent 
              editor={editor} 
              className="prose prose-slate max-w-none focus:outline-none"
            />
          ) : (
            <div 
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: document.content }}
            />
          )}
        </div>
      </div>

      {/* Comments sidebar */}
      <div className="w-full md:w-[380px] flex flex-col bg-surface border-l border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display text-lg font-bold">Comments</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!comments && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 shimmer rounded w-1/3" />
                    <div className="h-4 shimmer rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {comments && comments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No comments yet</p>
              <p className="text-xs mt-1">Be the first to comment</p>
            </div>
          )}
          {commentTree.map((comment) => (
            <div key={comment.id}>{renderComment(comment)}</div>
          ))}
        </div>

        {/* Add comment form */}
        {!replyTo && (
          <div className="p-4 border-t border-border bg-muted/20">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:border-accent focus-ring resize-none text-sm mb-3"
              rows={3}
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>Comment</span>
            </button>
          </div>
        )}
      </div>

      {/* Share modal */}
      {shareModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShareModal({ ...shareModal, isOpen: false })} />
          <div className="relative bg-surface rounded-xl border border-border shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-display text-xl font-bold">Share Document</h3>
            </div>
            <div className="p-6">
              <input
                type="search"
                placeholder="Search users by name or email..."
                value={shareModal.searchQuery}
                onChange={(e) => setShareModal({ ...shareModal, searchQuery: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-accent focus-ring mb-4"
              />
              {/* User list would go here */}
              <p className="text-sm text-muted-foreground">Search for users to grant access</p>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShareModal({ ...shareModal, isOpen: false })}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover transition-colors"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
