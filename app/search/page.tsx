'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { SearchInput } from '@/components/features/search/SearchInput';
import { SearchResults } from '@/components/features/search/SearchResults';
import { fetcher } from '@/lib/utils/api';

interface SearchResult {
  documents: Array<{
    id: string;
    title: string;
    type: string;
    owner: {
      id: string;
      name: string;
    };
    createdAt: string;
    excerpt: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    documentId: string;
    documentTitle: string;
    author: {
      id: string;
      name: string;
    };
    createdAt: string;
    excerpt: string;
  }>;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data: results, isLoading } = useSWR<SearchResult>(
    query ? `/api/search?q=${encodeURIComponent(query)}` : null,
    fetcher
  );

  const totalResults = (results?.documents?.length || 0) + (results?.comments?.length || 0);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Search input */}
      <div className="mb-8">
        <SearchInput initialQuery={query} />
        
        {query && (
          <div className="mt-4 text-sm text-muted-foreground">
            {isLoading ? (
              <span>Searching...</span>
            ) : (
              <span>
                Found <span className="font-medium text-foreground">{totalResults}</span> results for "{query}"
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <SearchResults results={results || null} query={query} isLoading={isLoading} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}

