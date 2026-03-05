'use client';

import { useState, Suspense } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ClipboardBar } from '@/components/layout/ClipboardBar';

interface LayoutContentProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  children: React.ReactNode;
}

export function LayoutContent({ user, children }: LayoutContentProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<div className="p-8">Loading...</div>}>
            {children}
          </Suspense>
        </main>
      </div>

      <ClipboardBar />
    </div>
  );
}
