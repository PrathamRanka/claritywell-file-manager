'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Users, FileText, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { StatCard, LoadingSpinner } from '@/components/ui';

function AdminDashboard() {
  const { stats, isError, isLoading } = useDashboardStats();

  return (
    <div className="space-y-8">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={isLoading ? '—' : (stats?.totalUsers ?? 0)}
          icon={Users}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Total Documents"
          value={isLoading ? '—' : (stats?.totalDocuments ?? 0)}
          icon={FileText}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Departments"
          value={isLoading ? '—' : (stats?.totalDepartments ?? 0)}
          icon={Building2}
          iconColor="text-green-600"
        />
      </div>

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load dashboard data
        </div>
      )}
    </div>
  );
}

function UserDashboard({ userId }: { userId: string }) {
  return (
    <div className="space-y-8">
      <div className="text-center py-8 text-slate-600">
        <p className="text-lg">Welcome! Your dashboard will show your documents and requirements here.</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (!session?.user) {
    router.push('/login');
    return <LoadingSpinner message="Redirecting..." />;
  }

  const user = session.user as any;

  return (
    <div className="w-full bg-white text-slate-900">
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b pb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-slate-600 text-lg">
            {user.role === 'ADMIN' ? 'System overview and recent activity' : 'Your documents and requirements'}
          </p>
          <p className="text-slate-500 mt-2">Welcome, {user.name || user.email}</p>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link href="/admin" className="p-4 border rounded-lg hover:border-purple-500 hover:shadow-md transition-all bg-slate-50">
            <div className="text-2xl mb-2">⚙️</div>
            <h3 className="font-semibold">Admin Panel</h3>
            <p className="text-sm text-slate-600">Manage users</p>
          </Link>
          <Link href="/documents" className="p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all bg-slate-50">
            <div className="text-2xl mb-2">📄</div>
            <h3 className="font-semibold">Documents</h3>
            <p className="text-sm text-slate-600">All files</p>
          </Link>
          <Link href="/folders" className="p-4 border rounded-lg hover:border-green-500 hover:shadow-md transition-all bg-slate-50">
            <div className="text-2xl mb-2">📁</div>
            <h3 className="font-semibold">Folders</h3>
            <p className="text-sm text-slate-600">Browse</p>
          </Link>
          <Link href="/requirements" className="p-4 border rounded-lg hover:border-orange-500 hover:shadow-md transition-all bg-slate-50">
            <div className="text-2xl mb-2">✓</div>
            <h3 className="font-semibold">Requirements</h3>
            <p className="text-sm text-slate-600">Track</p>
          </Link>
        </div>

        {/* Content based on role */}
        <div className="mt-8">
          {user.role === 'ADMIN' ? <AdminDashboard /> : <UserDashboard userId={user.id} />}
        </div>
      </div>
    </div>
  );
}
