import { create } from 'zustand';

export interface ClipboardItem {
  id: string;
  title: string;
}

export type ClipboardAction = 'copy' | 'cut' | null;

interface ClipboardState {
  items: ClipboardItem[];
  action: ClipboardAction;
  copy: (items: ClipboardItem[]) => void;
  cut: (items: ClipboardItem[]) => void;
  clear: () => void;
  getCount: () => number;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  items: [],
  action: null,
  
  copy: (items: ClipboardItem[]) => {
    set({ items, action: 'copy' });
  },
  
  cut: (items: ClipboardItem[]) => {
    set({ items, action: 'cut' });
  },
  
  clear: () => {
    set({ items: [], action: null });
  },
  
  getCount: () => {
    return get().items.length;
  },
}));
