'use client';

import { useState, useCallback, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Search, Menu, User, LogOut, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

interface TopbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  onMenuClick: () => void;
}

export function Topbar({ user, onMenuClick }: TopbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedSearch.trim()) {
      router.push(`/search?q=${encodeURIComponent(debouncedSearch)}`);
    }
  }, [debouncedSearch, router]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'user':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <header className="h-16 bg-surface border-b border-border sticky top-0 z-30 backdrop-blur-sm bg-surface/95">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Left: Menu + Search */}
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors focus-ring"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop search */}
          <div className="hidden md:flex items-center flex-1 relative">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Search documents and comments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2 rounded-lg
                bg-muted/50 border border-transparent
                focus:bg-surface focus:border-border-strong
                transition-all duration-200 focus-ring
                text-sm
              "
              aria-label="Search"
            />
          </div>

          {/* Mobile search icon */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors focus-ring"
            aria-label="Open search"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Notifications + User menu */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            className="relative p-2 rounded-lg hover:bg-muted transition-colors focus-ring"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="
                flex items-center gap-3 px-3 py-2 rounded-lg
                hover:bg-muted transition-colors focus-ring
              "
              aria-label="User menu"
              aria-expanded={showUserMenu}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center">
                <User className="w-4 h-4 text-accent-foreground" />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">{user.name || user.email}</div>
                <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
              </div>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                  aria-hidden="true"
                />
                <div className="
                  absolute right-0 top-full mt-2 w-64 z-50
                  bg-surface-raised border border-border rounded-lg shadow-lg
                  overflow-hidden
                  animate-in fade-in slide-in-from-top-2 duration-200
                ">
                  <div className="p-4 border-b border-border">
                    <div className="font-medium">{user.name || 'User'}</div>
                    <div className="text-sm text-muted-foreground mt-1">{user.email}</div>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="
                      w-full flex items-center gap-3 px-4 py-3
                      hover:bg-muted transition-colors text-left
                      text-sm text-destructive
                    "
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search overlay */}
      {isMobileSearchOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-surface border-b border-border p-4 shadow-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search documents and comments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2 rounded-lg
                bg-muted/50 border border-border
                focus:border-border-strong
                transition-all focus-ring
              "
              autoFocus
              aria-label="Search"
            />
          </div>
        </div>
      )}
    </header>
  );
}
