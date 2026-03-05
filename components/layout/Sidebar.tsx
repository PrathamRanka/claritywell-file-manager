'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen, Plus, Home, Building2, FileText } from 'lucide-react';
import useSWR from 'swr';

interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  documentCount?: number;
  children?: FolderNode[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type FoldersApiResponse =
  | FolderNode[]
  | { folders?: FolderNode[] }
  | { data?: { folders?: FolderNode[] } };

const fetcher = async (url: string): Promise<FolderNode[]> => {
  const res = await fetch(url);
  const json = (await res.json()) as FoldersApiResponse;

  if (Array.isArray(json)) {
    return json;
  }

  if (json && typeof json === 'object' && 'folders' in json && Array.isArray(json.folders)) {
    return json.folders;
  }

  if (
    json &&
    typeof json === 'object' &&
    'data' in json &&
    json.data &&
    typeof json.data === 'object' &&
    Array.isArray(json.data.folders)
  ) {
    return json.data.folders;
  }

  return [];
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const { data: folders, error } = useSWR<FolderNode[]>('/api/folders', fetcher);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Build tree structure from flat list
  const buildTree = (folders: FolderNode[]): FolderNode[] => {
    const map = new Map<string, FolderNode>();
    const roots: FolderNode[] = [];

    folders.forEach((folder) => {
      map.set(folder.id, { ...folder, children: [] });
    });

    folders.forEach((folder) => {
      const node = map.get(folder.id)!;
      if (folder.parentId) {
        const parent = map.get(folder.parentId);
        if (parent) {
          parent.children!.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const renderFolder = (folder: FolderNode, depth = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;
    const isActive = pathname === `/folders/${folder.id}`;

    return (
      <div key={folder.id} className="relative">
        <div
          className={`
            group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
            transition-all duration-200 relative
            ${isActive ? 'bg-accent/10 text-accent font-medium' : 'hover:bg-muted text-foreground'}
          `}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => hasChildren && toggleFolder(folder.id)}
        >
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent rounded-r-full" />
          )}
          
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="flex-shrink-0"
              aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          
          <Link
            href={`/folders/${folder.id}`}
            className="flex items-center gap-2 flex-1 min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            {isExpanded || isActive ? (
              <FolderOpen className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="truncate flex-1">{folder.name}</span>
            {folder.documentCount !== undefined && folder.documentCount > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {folder.documentCount}
              </span>
            )}
          </Link>

          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement new subfolder creation
            }}
            aria-label="Create subfolder"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {isExpanded && hasChildren && (
          <div className="space-y-0.5">
            {folder.children!.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const tree = folders ? buildTree(folders) : [];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-60 bg-surface border-r border-border
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight group-hover:text-accent transition-colors">
              DocVault
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Quick links */}
          <div className="space-y-0.5 mb-4">
            <Link
              href="/"
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                ${pathname === '/' ? 'bg-accent/10 text-accent font-medium' : 'hover:bg-muted'}
              `}
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            
            <Link
              href="/admin"
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                ${pathname.startsWith('/admin') ? 'bg-accent/10 text-accent font-medium' : 'hover:bg-muted'}
              `}
            >
              <Building2 className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          </div>

          {/* Folders section */}
          <div>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Folders
            </div>
            <div className="space-y-0.5">
              {error && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Failed to load folders
                </div>
              )}
              {!folders && !error && (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 shimmer rounded" />
                  ))}
                </div>
              )}
              {folders && tree.map((folder) => renderFolder(folder))}
            </div>
          </div>
        </nav>

        {/* Footer - user info or branding */}
        <div className="p-3 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            DocVault © 2026
          </div>
        </div>
      </aside>
    </>
  );
}
