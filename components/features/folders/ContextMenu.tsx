'use client';

import { useEffect } from 'react';
import { Copy, Scissors, Trash2 } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onCopy: () => void;
  onCut: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ContextMenu({ x, y, onCopy, onCut, onDelete, onClose }: ContextMenuProps) {
  useEffect(() => {
    const handleClick = () => onClose();
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      onClose();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [onClose]);

  return (
    <div
      className="fixed z-50 bg-surface border border-border rounded-lg shadow-xl py-1 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCopy();
        }}
        className="w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors flex items-center gap-3"
      >
        <Copy className="w-4 h-4" />
        Copy
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCut();
        }}
        className="w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors flex items-center gap-3"
      >
        <Scissors className="w-4 h-4" />
        Cut
      </button>
      <hr className="my-1 border-border" />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="w-full px-4 py-2 text-sm text-left hover:bg-red-50 text-red-600 transition-colors flex items-center gap-3"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
    </div>
  );
}
