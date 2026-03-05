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
          fetch('/api/users?limit=1000').catch(() => null),
          fetch('/api/departments?limit=1000').catch(() => null),
          fetch('/api/requirements?limit=1000').catch(() => null),
        ]);

        let users = [];
        let departments = [];
        let requirements = [];

        // Safely parse each response
        if (usersRes?.ok) {
          const usersData = await usersRes.json();
          if (Array.isArray(usersData)) {
            users = usersData;
          } else if (usersData.data?.users && Array.isArray(usersData.data.users)) {
            users = usersData.data.users;
          } else if (usersData.users && Array.isArray(usersData.users)) {
            users = usersData.users;
          }
        }

        if (departmentsRes?.ok) {
          const departmentsData = await departmentsRes.json();
          if (Array.isArray(departmentsData)) {
            departments = departmentsData;
          } else if (departmentsData.data?.departments && Array.isArray(departmentsData.data.departments)) {
            departments = departmentsData.data.departments;
          } else if (departmentsData.departments && Array.isArray(departmentsData.departments)) {
            departments = departmentsData.departments;
          }
        }

        if (requirementsRes?.ok) {
          const requirementsData = await requirementsRes.json();
          if (Array.isArray(requirementsData)) {
            requirements = requirementsData;
          } else if (requirementsData.data?.requirements && Array.isArray(requirementsData.data.requirements)) {
            requirements = requirementsData.data.requirements;
          } else if (requirementsData.requirements && Array.isArray(requirementsData.requirements)) {
            requirements = requirementsData.requirements;
          }
        }

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
          title="Total Users"
          value={stats.totalUsers}
          iconColor="text-blue-600"
        />
        <StatCard
          icon={Building2}
          title="Departments"
          value={stats.totalDepartments}
          iconColor="text-purple-600"
        />
        <StatCard
          icon={FileText}
          title="Requirements"
          value={stats.totalRequirements}
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
