'use client';

import { useState } from 'react';
import { Users, Building2, FileText, Activity } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useDepartments } from '@/hooks/useDepartments';
import { useRequirements } from '@/hooks/useRequirement';
import { UsersTab } from '@/components/features/admin/UsersTab';
import { DepartmentsTab } from '@/components/features/admin/DepartmentsTab';
import { RequirementsTab } from '@/components/features/admin/RequirementsTab';
import { AuditLogsTab } from '@/components/features/admin/AuditLogsTab';
import { AdminDashboardOverview } from '@/components/features/admin/AdminDashboardOverview';

type TabType = 'users' | 'departments' | 'requirements' | 'audit';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('users');

  const { users, mutate: mutateUsers } = useUsers();
  const { departments, mutate: mutateDepartments } = useDepartments();
  const { requirements, mutate: mutateRequirements } = useRequirements();

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
      <AdminDashboardOverview />

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

