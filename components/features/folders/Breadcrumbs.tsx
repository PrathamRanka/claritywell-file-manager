'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Folder } from '@/hooks/useFolder';

interface BreadcrumbsProps {
  folders: Folder[];
}

export function Breadcrumbs({ folders }: BreadcrumbsProps) {
  if (folders.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      {folders.map((folder, index) => (
        <div key={folder.id} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          <Link
            href={`/folders/${folder.id}`}
            className={`hover:text-accent transition-colors ${
              index === folders.length - 1
                ? 'font-medium text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            {folder.name}
          </Link>
        </div>
      ))}
    </nav>
  );
}
