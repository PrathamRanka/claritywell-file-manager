'use client';

import { useClipboardStore } from '@/store/clipboard';
import { Copy, Scissors, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useEffect } from 'react';

export function ClipboardBar() {
  const { items, action, clear } = useClipboardStore();
  const router = useRouter();

  // Sync with server clipboard state on mount
  useEffect(() => {
    const syncClipboard = async () => {
      try {
        const res = await fetch('/api/clipboard');
        if (res.ok) {
          const { data } = await res.json();
          // Server clipboard state can be used for persistence across sessions
          // Currently using client-side store for performance
        }
      } catch (error) {
        console.error('Failed to sync clipboard:', error);
      }
    };
    syncClipboard();
  }, []);

  const handlePaste = async () => {
    // This will be used in the folder page to paste items
    // For now, just show a toast
    toast.info('Navigate to a folder to paste items');
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 slide-up">
      <div className="
        bg-surface-raised/95 backdrop-blur-md border border-border-strong
        rounded-xl shadow-xl px-6 py-4 flex items-center gap-4
        min-w-[320px]
      ">
        {/* Icon */}
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${action === 'cut' ? 'bg-warning/10 text-warning' : 'bg-accent/10 text-accent'}
        `}>
          {action === 'cut' ? (
            <Scissors className="w-5 h-5" />
          ) : (
            <Copy className="w-5 h-5" />
          )}
        </div>

        {/* Text */}
        <div className="flex-1">
          <div className="font-medium text-sm">
            {items.length} item{items.length !== 1 ? 's' : ''} {action === 'cut' ? 'cut' : 'copied'}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {items[0].title}
            {items.length > 1 && `, +${items.length - 1} more`}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePaste}
            className="
              px-4 py-2 rounded-lg bg-accent text-accent-foreground
              hover:bg-accent-hover transition-colors text-sm font-medium
              focus-ring
            "
            aria-label="Paste items"
          >
            Paste here
          </button>
          
          <button
            onClick={clear}
            className="
              p-2 rounded-lg hover:bg-muted transition-colors
              focus-ring
            "
            aria-label="Clear clipboard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
