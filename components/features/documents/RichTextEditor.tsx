'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface RichTextEditorProps {
  content: string;
  editable: boolean;
  onUpdate: (content: string) => void;
}

export function RichTextEditor({ content, editable, onUpdate }: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  if (!isMounted) {
    return <div className="animate-pulse h-64 bg-surface border border-border rounded-lg" />;
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {editable && (
        <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30">
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-muted transition-colors ${
              editor?.isActive('bold') ? 'bg-muted text-accent' : ''
            }`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-muted transition-colors ${
              editor?.isActive('italic') ? 'bg-muted text-accent' : ''
            }`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-muted transition-colors ${
              editor?.isActive('heading', { level: 1 }) ? 'bg-muted text-accent' : ''
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-muted transition-colors ${
              editor?.isActive('heading', { level: 2 }) ? 'bg-muted text-accent' : ''
            }`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-muted transition-colors ${
              editor?.isActive('bulletList') ? 'bg-muted text-accent' : ''
            }`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-muted transition-colors ${
              editor?.isActive('orderedList') ? 'bg-muted text-accent' : ''
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>
      )}
      <EditorContent
        editor={editor}
        className="prose prose-slate max-w-none p-6 min-h-[400px] focus:outline-none"
      />
    </div>
  );
}
