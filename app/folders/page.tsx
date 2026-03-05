'use client';

import { useFolders } from '@/hooks/useFolder';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { Folder, FolderOpen } from 'lucide-react';
import Link from 'next/link';

export default function FoldersPage() {
  const { folders, isLoading, isError } = useFolders();

  if (isLoading) {
    return <LoadingSpinner message="Loading folders..." />;
  }

  if (isError) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load folders. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Folders</h1>
        <p className="text-muted-foreground">
          Browse and organize your documents by folder
        </p>
      </div>

      {/* Folders Grid */}
      {!folders || folders.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No folders found"
          description="Folders will appear here once they are created"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <Link
              key={folder.id}
              href={`/folders/${folder.id}`}
              className="group relative bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <FolderOpen className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {folder.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {folder.documentCount ?? 0} document{folder.documentCount !== 1 ? 's' : ''}
                  </p>
                  {folder.parent && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      in {folder.parent.name}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
