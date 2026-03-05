'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { 
  Users, Building2, FileText, Plus, Trash2, Edit3, 
  ChevronDown, ChevronRight, UserPlus, X, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type TabType = 'users' | 'departments' | 'requirements';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  departments: Array<{ id: string; name: string }>;
}

interface Department {
  id: string;
  name: string;
  members: Array<{ id: string; name: string; email: string }>;
}

interface Requirement {
  id: string;
  clientName: string;
  dueDate: string;
  priority: string;
  status: string;
  department: {
    id: string;
    name: string;
  };
}

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['USER', 'ADMIN']),
});

const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

const createRequirementSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  departmentId: z.string().min(1, 'Department is required'),
});

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateDepartment, setShowCreateDepartment] = useState(false);
  const [showCreateRequirement, setShowCreateRequirement] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());

  const { data: users, mutate: mutateUsers } = useSWR<User[]>('/api/users', fetcher);
  const { data: departments, mutate: mutateDepartments } = useSWR<Department[]>('/api/departments', fetcher);
  const { data: requirements, mutate: mutateRequirements } = useSWR<Requirement[]>('/api/requirements', fetcher);

  const toggleDepartment = (id: string) => {
    setExpandedDepartments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Administration</h1>
        <p className="text-muted-foreground">Manage users, departments, and requirements</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-t-lg transition-colors
              ${activeTab === 'users' 
                ? 'bg-surface border-l border-t border-r border-border text-accent font-medium' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }
            `}
          >
            <Users className="w-4 h-4" />
            <span>Users</span>
          </button>
          
          <button
            onClick={() => setActiveTab('departments')}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-t-lg transition-colors
              ${activeTab === 'departments' 
                ? 'bg-surface border-l border-t border-r border-border text-accent font-medium' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }
            `}
          >
            <Building2 className="w-4 h-4" />
            <span>Departments</span>
          </button>
          
          <button
            onClick={() => setActiveTab('requirements')}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-t-lg transition-colors
              ${activeTab === 'requirements' 
                ? 'bg-surface border-l border-t border-r border-border text-accent font-medium' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }
            `}
          >
            <FileText className="w-4 h-4" />
            <span>Requirements</span>
          </button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'users' && (
        <UsersTab 
          users={users} 
          showCreate={showCreateUser}
          setShowCreate={setShowCreateUser}
          mutate={mutateUsers}
        />
      )}
      
      {activeTab === 'departments' && (
        <DepartmentsTab 
          departments={departments}
          showCreate={showCreateDepartment}
          setShowCreate={setShowCreateDepartment}
          mutate={mutateDepartments}
          expandedDepartments={expandedDepartments}
          toggleDepartment={toggleDepartment}
        />
      )}
      
      {activeTab === 'requirements' && (
        <RequirementsTab 
          requirements={requirements}
          departments={departments}
          showCreate={showCreateRequirement}
          setShowCreate={setShowCreateRequirement}
          mutate={mutateRequirements}
        />
      )}
    </div>
  );
}

function UsersTab({ users, showCreate, setShowCreate, mutate }: any) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(createUserSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      if (editingUserId) {
        await fetch(`/api/users/${editingUserId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.name, role: data.role }),
        });
        toast.success('User updated');
        setEditingUserId(null);
      } else {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        toast.success('User created');
        setShowCreate(false);
      }
      reset();
      mutate();
    } catch {
      toast.error(editingUserId ? 'Failed to update user' : 'Failed to create user');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUserId(user.id);
    setValue('name', user.name);
    setValue('role', user.role);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      toast.success('User deleted');
      mutate();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create User</span>
        </button>
      </div>

      {/* Users table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Departments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!users && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><div className="h-4 shimmer rounded w-32" /></td>
                      <td className="px-6 py-4"><div className="h-4 shimmer rounded w-40" /></td>
                      <td className="px-6 py-4"><div className="h-4 shimmer rounded w-16" /></td>
                      <td className="px-6 py-4"><div className="h-4 shimmer rounded w-24" /></td>
                      <td className="px-6 py-4"><div className="h-4 shimmer rounded w-20" /></td>
                      <td className="px-6 py-4"><div className="h-4 shimmer rounded w-12 ml-auto" /></td>
                    </tr>
                  ))}
                </>
              )}
              {users?.map((user: User) => (
                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${
                      user.role === 'ADMIN' 
                        ? 'bg-accent/10 text-accent border-accent/20' 
                        : 'bg-muted text-foreground border-border'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {user.departments.map((d) => d.name).join(', ') || 'None'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create user slide-over */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-md bg-surface shadow-xl overflow-y-auto slide-in-from-right">
            <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold">Create User</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  {...register('name')}
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-transparent focus:bg-surface focus:border-accent focus-ring"
                />
                {errors.name && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-destructive text-sm">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.name.message as string}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-transparent focus:bg-surface focus:border-accent focus-ring"
                />
                {errors.email && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-destructive text-sm">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.email.message as string}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-transparent focus:bg-surface focus:border-accent focus-ring"
                />
                {errors.password && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-destructive text-sm">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.password.message as string}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  {...register('role')}
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-transparent focus:bg-surface focus:border-accent focus-ring"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover transition-colors"
              >
                Create User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit user slide-over */}
      {editingUserId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingUserId(null)} />
          <div className="relative w-full max-w-md bg-surface shadow-xl overflow-y-auto slide-in-from-right">
            <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold">Edit User</h3>
              <button onClick={() => setEditingUserId(null)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  {...register('name')}
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-transparent focus:bg-surface focus:border-accent focus-ring"
                />
                {errors.name && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-destructive text-sm">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.name.message as string}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  {...register('role')}
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-transparent focus:bg-surface focus:border-accent focus-ring"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover transition-colors"
              >
                Update User
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DepartmentsTab({ departments, showCreate, setShowCreate, mutate, expandedDepartments, toggleDepartment }: any) {
  const [editingDept, setEditingDept] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(createDepartmentSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      if (editingDept) {
        await fetch(`/api/departments/${editingDept}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        toast.success('Department updated');
        setEditingDept(null);
      } else {
        await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        toast.success('Department created');
        setShowCreate(false);
      }
      reset();
      mutate();
    } catch {
      toast.error(editingDept ? 'Failed to update department' : 'Failed to create department');
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept.id);
    setValue('name', dept.name);
  };

  const handleDelete = async (deptId: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await fetch(`/api/departments/${deptId}`, { method: 'DELETE' });
      toast.success('Department deleted');
      mutate();
    } catch {
      toast.error('Failed to delete department');
    }
  };

  const handleRemoveMember = async (userId: string, deptId: string) => {
    try {
      await fetch(`/api/departments/${deptId}/members/${userId}`, { method: 'DELETE' });
      toast.success('Member removed');
      mutate();
    } catch {
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Department</span>
        </button>
      </div>

      <div className="space-y-3">
        {!departments && (
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 shimmer rounded-lg" />
            ))}
          </>
        )}
        {departments?.map((dept: Department) => (
          <div key={dept.id} className="bg-surface border border-border rounded-lg overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleDepartment(dept.id)}
            >
              <div className="flex items-center gap-3">
                {expandedDepartments.has(dept.id) ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
                <Building2 className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="font-medium">{dept.name}</h3>
                  <p className="text-sm text-muted-foreground">{dept.members?.length || 0} members</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(dept);
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(dept.id);
                  }}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {expandedDepartments.has(dept.id) && (
              <div className="border-t border-border p-4 bg-muted/20">
                {dept.members.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
                ) : (
                  <div className="space-y-2">
                    {dept.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        <button 
                          onClick={() => handleRemoveMember(member.id, dept.id)}
                          className="p-1 hover:bg-muted rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create department modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative bg-surface rounded-xl border border-border shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-display text-xl font-bold">Create Department</h3>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Department Name</label>
                <input
                  {...register('name')}
                  placeholder="e.g. Engineering, Sales, HR"
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-transparent focus:bg-surface focus:border-accent focus-ring"
                />
                {errors.name && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-destructive text-sm">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.name.message as string}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit department modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingDept(null)} />
          <div className="relative bg-surface rounded-xl border border-border shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-display text-xl font-bold">Edit Department</h3>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Department Name</label>
                <input
                  {...register('name')}
                  placeholder="e.g. Engineering, Sales, HR"
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-transparent focus:bg-surface focus:border-accent focus-ring"
                />
                {errors.name && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-destructive text-sm">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.name.message as string}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover transition-colors"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RequirementsTab({ requirements, departments, showCreate, setShowCreate, mutate }: any) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(createRequirementSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      toast.success('Requirement created');
      setShowCreate(false);
      reset();
      mutate();
    } catch {
      toast.error('Failed to create requirement');
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'bg-priority-low/10 text-priority-low border-priority-low/20',
      MEDIUM: 'bg-priority-medium/10 text-priority-medium border-priority-medium/20',
      HIGH: 'bg-priority-high/10 text-priority-high border-priority-high/20',
      URGENT: 'bg-priority-urgent/10 text-priority-urgent border-priority-urgent/20',
    };
    return colors[priority as keyof typeof colors] || colors.LOW;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Requirement</span>
        </button>
      </div>

      {/* Requirements table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!requirements && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><div className="h-4 shimmer rounded w-32" /></td>
                      <td className="px-6 py-4"><div className="h-4 shimmer rounded w-24" /></td>
                      <td className="px-6 py-4"><div className="h-4 shimmer rounded w-16" /></td>
                      <td className="px-6 py-4"><div className="h-4 shimmer rounded w-20" /></td>
                      <td className="px-6 py-4"><div className="h-4 shimmer rounded w-24" /></td>
                      <td className="px-6 py-4"><div className="h-4 shimmer rounded w-12 ml-auto" /></td>
                    </tr>
                  ))}
                </>
              )}
              {requirements?.map((req: Requirement) => (
                <tr key={req.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{req.clientName}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {format(new Date(req.dueDate), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(req.priority)}`}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm capitalize">{req.status.toLowerCase().replace('_', ' ')}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{req.department.name}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create requirement slide-over */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-md bg-surface shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold">Create Requirement</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Client Name</label>
                <input
                  {...register('clientName')}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-transparent focus:bg-surface focus:border-accent focus-ring"
                />
                {errors.clientName && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-destructive text-sm">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.clientName.message as string}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Due Date</label>
                <input
                  {...register('dueDate')}
                  type="date"
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-transparent focus:bg-surface focus:border-accent focus-ring"
                />
                {errors.dueDate && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-destructive text-sm">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.dueDate.message as string}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  {...register('priority')}
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-transparent focus:bg-surface focus:border-accent focus-ring"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Department</label>
                <select
                  {...register('departmentId')}
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-transparent focus:bg-surface focus:border-accent focus-ring"
                >
                  <option value="">Select department</option>
                  {departments?.map((dept: Department) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                {errors.departmentId && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-destructive text-sm">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.departmentId.message as string}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover transition-colors"
              >
                Create Requirement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
