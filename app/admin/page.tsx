'use client';

import { useState } from 'react';
import { Users, Building2, FileText, Activity } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUsers } from '@/hooks/useUsers';
import { useDepartments } from '@/hooks/useDepartments';
import { useRequirements } from '@/hooks/useRequirement';
import { UsersTab } from '@/components/features/admin/UsersTab';
import { DepartmentsTab } from '@/components/features/admin/DepartmentsTab';
import { RequirementsTab } from '@/components/features/admin/RequirementsTab';
import { AuditLogsTab } from '@/components/features/admin/AuditLogsTab';
import { AdminDashboardOverview } from '@/components/features/admin/AdminDashboardOverview';
import { LoadingSpinner } from '@/components/ui';

type TabType = 'users' | 'departments' | 'requirements' | 'audit';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const isAdmin = status === 'authenticated' && session?.user?.role === 'ADMIN';

  const { users, mutate: mutateUsers, isError: usersError } = useUsers(isAdmin);
  const { departments, mutate: mutateDepartments, isError: departmentsError } = useDepartments(isAdmin);
  const { requirements, mutate: mutateRequirements, isError: requirementsError } = useRequirements(isAdmin);

  // Check authentication and authorization
  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (!session?.user) {
    router.push('/login');
    return <LoadingSpinner message="Redirecting to login..." />;
  }

  if (!isAdmin) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-700">
            You do not have permission to access this page. Admin privileges are required.
          </p>
        </div>
      </div>
    );
  }

  // Handle API errors
  if (usersError || departmentsError || requirementsError) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Loading Error</h2>
          <p className="text-yellow-700 mb-4">
            Some data could not be loaded. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'users' as TabType, label: 'Users', icon: Users },
    { id: 'departments' as TabType, label: 'Departments', icon: Building2 },
    { id: 'requirements' as TabType, label: 'Requirements', icon: FileText },
    { id: 'audit' as TabType, label: 'Audit Logs', icon: Activity },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Administration</h1>
        <p className="text-muted-foreground">Manage users, departments, requirements, and monitor system activity</p>
      </div>

      {/* Dashboard Overview */}
      <AdminDashboardOverview
        totalUsers={users.length}
        totalDepartments={departments.length}
        totalRequirements={requirements.length}
      />

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-t-lg transition-colors
                  ${
                    isActive
                      ? 'bg-surface border-l border-t border-r border-border text-accent font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'users' && <UsersTab users={users} mutate={mutateUsers} />}
      {activeTab === 'departments' && (
        <DepartmentsTab departments={departments} mutate={mutateDepartments} />
      )}
      {activeTab === 'requirements' && (
        <RequirementsTab
          requirements={requirements}
          departments={departments}
          mutate={mutateRequirements}
        />
      )}
      {activeTab === 'audit' && <AuditLogsTab />}
    </div>
  );
}

