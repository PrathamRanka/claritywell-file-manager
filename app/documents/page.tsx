'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocument';
import { LoadingSpinner } from '@/components/ui';
import { Pagination } from '@/components/ui/Pagination';
import { DocumentGrid } from '@/components/features/documents/DocumentGrid';

export default function DocumentsPage() {
  const [page, setPage] = useState(1);
  const { documents, totalPages, isLoading, isError } = useDocuments({ page, limit: 20 });
  const documentItems = Array.isArray(documents?.items) ? documents.items : [];

  if (isLoading) {
    return <LoadingSpinner message="Loading documents..." />;
  }

  if (isError) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load documents. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Documents</h1>
        <p className="text-muted-foreground">Browse documents you can access across the workspace</p>
      </div>

      <DocumentGrid documents={documentItems} isLoading={isLoading} />

      {!isLoading && documentItems.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
          <p className="text-sm text-muted-foreground">
            {documentItems.length} document{documentItems.length !== 1 ? 's' : ''} shown on this page
          </p>
          <div className="flex-1 max-w-sm">
            <Pagination 
              currentPage={page} 
              totalPages={totalPages} 
              onPageChange={setPage} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
