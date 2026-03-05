'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { Search, FileText, MessageSquare, User, Calendar, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);

  const { data: results, isLoading } = useSWR<SearchResult>(
    query ? `/api/search?q=${encodeURIComponent(query)}` : null,
    fetcher
  );

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput)}`);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-accent/20 text-accent font-medium px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  const totalResults = (results?.documents.length || 0) + (results?.comments.length || 0);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Search input */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search documents and comments..."
            className="
              w-full pl-12 pr-4 py-3 rounded-xl
              bg-surface border-2 border-border
              focus:border-accent focus-ring
              text-lg
            "
            autoFocus
          />
        </form>
        
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
      {isLoading && (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-6 shimmer rounded w-32" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-lg p-4 space-y-2">
                <div className="h-5 shimmer rounded w-3/4" />
                <div className="h-4 shimmer rounded w-full" />
                <div className="h-4 shimmer rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {results && totalResults === 0 && (
        <div className="text-center py-16">
          <Inbox className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-display text-xl font-bold mb-2">No results found</h3>
          <p className="text-muted-foreground">
            Try searching with different keywords
          </p>
        </div>
      )}

      {results && totalResults > 0 && (
        <div className="space-y-8">
          {/* Documents section */}
          {results.documents.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-accent" />
                <h2 className="font-display text-xl font-bold">
                  Documents
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({results.documents.length})
                  </span>
                </h2>
              </div>

              <div className="space-y-3">
                {results.documents.map((doc, index) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="block bg-surface border border-border rounded-lg p-4 hover:border-accent hover:shadow-md transition-all card-lift stagger-item"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-file-wysiwyg/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" style={{ color: 'rgb(var(--file-wysiwyg))' }} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-lg mb-1">
                          {highlightText(doc.title, query)}
                        </h3>
                        
                        {doc.excerpt && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {highlightText(doc.excerpt, query)}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {doc.owner.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Comments section */}
          {results.comments.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-accent" />
                <h2 className="font-display text-xl font-bold">
                  Comments
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({results.comments.length})
                  </span>
                </h2>
              </div>

              <div className="space-y-3">
                {results.comments.map((comment, index) => (
                  <Link
                    key={comment.id}
                    href={`/documents/${comment.documentId}#comment-${comment.id}`}
                    className="block bg-surface border border-border rounded-lg p-4 hover:border-accent hover:shadow-md transition-all card-lift stagger-item"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-accent-foreground">
                          {comment.author.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-sm">{comment.author.name}</span>
                          <span className="text-xs text-muted-foreground">commented on</span>
                          <span className="font-medium text-sm text-accent">{comment.documentTitle}</span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {highlightText(comment.excerpt || comment.content, query)}
                        </p>

                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Empty state when no query */}
      {!query && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="font-display text-xl font-bold mb-2">Start searching</h3>
          <p className="text-sm">
            Enter a keyword to search across documents and comments
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="h-12 shimmer rounded-xl mb-8" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 shimmer rounded-lg" />
          ))}
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
