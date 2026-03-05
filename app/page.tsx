'use client';

import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { Users, FileText, Building2, Activity, TrendingUp, Clock, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface DashboardStats {
  totalUsers: number;
  totalDocuments: number;
  totalDepartments: number;
}

interface RecentActivity {
  id: string;
  action: string;
  userId: string;
  userName: string;
  entityType: string;
  entityId: string;
  entityName: string;
  createdAt: string;
}

interface Document {
  id: string;
  title: string;
  createdAt: string;
  owner: {
    name: string;
  };
  visibility: string;
}

interface Requirement {
  id: string;
  clientName: string;
  dueDate: string;
  priority: string;
  status: string;
  department: {
    name: string;
  };
}

function AdminDashboard() {
  const { data: stats } = useSWR<DashboardStats>('/api/dashboard/stats', fetcher);
  const { data: activities } = useSWR<RecentActivity[]>('/api/audit-log?limit=10', fetcher);

  return (
    <div className="space-y-8">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative overflow-hidden bg-surface border border-border rounded-xl p-6 card-lift">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Users</p>
              <p className="text-3xl font-display font-bold">
                {stats?.totalUsers || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-success">
            <TrendingUp className="w-4 h-4" />
            <span>Active team members</span>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-surface border border-border rounded-xl p-6 card-lift">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Documents</p>
              <p className="text-3xl font-display font-bold">
                {stats?.totalDocuments || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-accent" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="w-4 h-4" />
            <span>Across all folders</span>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-surface border border-border rounded-xl p-6 card-lift">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Departments</p>
              <p className="text-3xl font-display font-bold">
                {stats?.totalDepartments || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Organized teams</span>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display text-xl font-bold">Recent Activity</h2>
        </div>
        <div className="divide-y divide-border">
          {!activities && (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 shimmer rounded w-3/4" />
                    <div className="h-3 shimmer rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {activities && activities.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity</p>
            </div>
          )}
          {activities?.map((activity, index) => (
            <div key={activity.id} className="px-6 py-4 hover:bg-muted/50 transition-colors stagger-item" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-accent-foreground">
                    {activity.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.userName}</span>{' '}
                    <span className="text-muted-foreground">{activity.action}</span>{' '}
                    <span className="font-medium">{activity.entityName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserDashboard({ userId }: { userId: string }) {
  const { data: documents } = useSWR<Document[]>(`/api/documents?userId=${userId}&limit=10`, fetcher);
  const { data: requirements } = useSWR<Requirement[]>('/api/requirements', fetcher);

  return (
    <div className="space-y-8">
      {/* My Documents */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">My Recent Documents</h2>
          <Link
            href="/folders"
            className="text-sm text-accent hover:text-accent-hover transition-colors font-medium"
          >
            View all
          </Link>
        </div>
        <div className="p-6">
          {!documents && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 shimmer rounded-lg" />
              ))}
            </div>
          )}
          {documents && documents.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No documents yet</p>
              <p className="text-sm mt-1">Create your first document to get started</p>
            </div>
          )}
          {documents && documents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc, index) => (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="block bg-muted/50 border border-border rounded-lg p-4 hover:border-accent hover:shadow-md transition-all card-lift stagger-item"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-file-wysiwyg/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5" style={{ color: 'rgb(var(--file-wysiwyg))' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{doc.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Department Requirements */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display text-xl font-bold">Department Requirements</h2>
        </div>
        <div className="divide-y divide-border">
          {!requirements && (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 shimmer rounded-lg" />
              ))}
            </div>
          )}
          {requirements && requirements.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <p>No requirements assigned</p>
            </div>
          )}
          {requirements?.map((req, index) => {
            const priorityColors = {
              LOW: 'bg-priority-low/10 text-priority-low border-priority-low/20',
              MEDIUM: 'bg-priority-medium/10 text-priority-medium border-priority-medium/20',
              HIGH: 'bg-priority-high/10 text-priority-high border-priority-high/20',
              URGENT: 'bg-priority-urgent/10 text-priority-urgent border-priority-urgent/20',
            };

            return (
              <Link
                key={req.id}
                href={`/requirements/${req.id}`}
                className="block px-6 py-4 hover:bg-muted/50 transition-colors stagger-item"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{req.clientName}</h3>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5" />
                      {req.department.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${priorityColors[req.priority as keyof typeof priorityColors]}`}>
                      {req.priority}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Due {formatDistanceToNow(new Date(req.dueDate), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-xl font-semibold text-slate-900">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    router.push('/login');
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-xl font-semibold text-slate-900">Redirecting...</p>
        </div>
      </div>
    );
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
