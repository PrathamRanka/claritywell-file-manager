'use client';

import { Users, Building2, FileText, Activity } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
type AdminDashboardOverviewProps = {
  totalUsers: number;
  totalDepartments: number;
  totalRequirements: number;
};

export function AdminDashboardOverview({
  totalUsers,
  totalDepartments,
  totalRequirements,
}: AdminDashboardOverviewProps) {

  return (
    <div className="mb-8">
      <h2 className="font-display text-xl font-bold mb-4">Dashboard Overview</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          title="Total Users"
          value={totalUsers}
          iconColor="text-blue-600"
        />
        <StatCard
          icon={Building2}
          title="Departments"
          value={totalDepartments}
          iconColor="text-purple-600"
        />
        <StatCard
          icon={FileText}
          title="Requirements"
          value={totalRequirements}
          iconColor="text-green-600"
        />
        <StatCard
          icon={Activity}
          title="System Status"
          value="Healthy"
          iconColor="text-emerald-600"
        />
      </div>
    </div>
  );
}
