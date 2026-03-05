'use client';

import { Search } from 'lucide-react';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface SearchInputProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
}

export function SearchInput({ initialQuery = '', onSearch }: SearchInputProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialQuery);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed) {
      if (onSearch) {
        onSearch(trimmed);
      } else {
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
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
  );
}
