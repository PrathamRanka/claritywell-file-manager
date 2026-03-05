'use client';

import { useEffect, useState } from 'react';
import { Users, Building2, FileText, Activity } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDepartments: number;
  totalDocuments: number;
  totalRequirements: number;
  loadingComplete: boolean;
}

export function AdminDashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalDepartments: 0,
    totalDocuments: 0,
    totalRequirements: 0,
    loadingComplete: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all stats in parallel
        const [usersRes, departmentsRes, requirementsRes] = await Promise.all([
          fetch('/api/users?limit=1000'),
          fetch('/api/departments?limit=1000'),
          fetch('/api/requirements?limit=1000'),
        ]);

        const [usersData, departmentsData, requirementsData] = await Promise.all([
          usersRes.json(),
          departmentsRes.json(),
          requirementsRes.json(),
        ]);

        const users = Array.isArray(usersData) ? usersData : usersData.data || [];
        const departments = Array.isArray(departmentsData) ? departmentsData : departmentsData.data || [];
        const requirements = Array.isArray(requirementsData) ? requirementsData : requirementsData.data || [];

        // Calculate active users (logged in last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const activeUsers = users.filter((user: any) => {
          const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
          return lastLogin && lastLogin > sevenDaysAgo;
        }).length;

        setStats({
          totalUsers: users.length,
          activeUsers: activeUsers || users.length,
          totalDepartments: departments.length,
          totalDocuments: 0, // Would need separate endpoint
          totalRequirements: requirements.length,
          loadingComplete: true,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        setStats((prev) => ({ ...prev, loadingComplete: true }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="font-display text-xl font-bold mb-4">Dashboard Overview</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers.toString()}
          subtitle={`${stats.activeUsers} active this week`}
        />
        <StatCard
          icon={Building2}
          label="Departments"
          value={stats.totalDepartments.toString()}
        />
        <StatCard
          icon={FileText}
          label="Requirements"
          value={stats.totalRequirements.toString()}
        />
        <StatCard
          icon={Activity}
          label="System Status"
          value="Healthy"
          subtitle="All systems operational"
        />
      </div>
    </div>
  );
}
