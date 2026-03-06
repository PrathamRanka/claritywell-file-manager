'use client';

import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Modal, Input, Select } from '@/components/ui';
import { Pagination } from '@/components/ui/Pagination';
import { Department } from '@/hooks/useDepartments';
import { useUsers } from '@/hooks/useUsers';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/utils/zodResolver';
import { createDepartmentSchema } from '@/lib/constants/schemas';
import { z } from 'zod';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type CreateDepartmentForm = z.infer<typeof createDepartmentSchema>;

interface DepartmentsTabProps {
  departments: Department[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  mutate: () => void;
}

export function DepartmentsTab({ departments, page, totalPages, onPageChange, mutate }: DepartmentsTabProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [showAddMember, setShowAddMember] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const { users } = useUsers();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateDepartmentForm>({
    resolver: zodResolver(createDepartmentSchema),
  });

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

  const onSubmit = async (data: CreateDepartmentForm) => {
    try {
      await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      toast.success('Department created');
      setShowCreate(false);
      reset();
      mutate();
    } catch {
      toast.error('Failed to create department');
    }
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

  const handleAddMember = async (deptId: string) => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    setIsAddingMember(true);
    try {
      const res = await fetch(`/api/departments/${deptId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser }),
      });

      if (!res.ok) throw new Error('Failed to add member');

      toast.success('Member added successfully');
      setShowAddMember(null);
      setSelectedUser('');
      mutate();
    } catch (err) {
      toast.error('Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (deptId: string, userId: string) => {
    if (!confirm('Remove this member from the department?')) return;

    try {
      const res = await fetch(`/api/departments/${deptId}/members/${userId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove member');

      toast.success('Member removed');
      mutate();
    } catch {
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)} icon={Plus}>
          Create Department
        </Button>
      </div>

      {/* Departments list */}
      <div className="space-y-3">
        {departments.map((dept) => {
          const isExpanded = expandedDepartments.has(dept.id);
          return (
            <div key={dept.id} className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleDepartment(dept.id)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <div>
                    <h3 className="font-medium">{dept.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {dept.members?.length || 0} members
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setShowAddMember(dept.id);
                      setSelectedUser('');
                    }}
                    variant="secondary"
                    size="sm"
                    icon={UserPlus}
                  >
                    Add Member
                  </Button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete department"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isExpanded && dept.members && dept.members.length > 0 && (
                <div className="border-t border-border p-4 bg-muted/30">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Members ({dept.members.length})
                  </h4>
                  <div className="space-y-2">
                    {dept.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-2 px-3 bg-background rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(dept.id, member.id)}
                          className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Pagination 
        currentPage={page} 
        totalPages={totalPages} 
        onPageChange={onPageChange} 
      />

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          reset();
        }}
        title="Create Department"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)}>Create</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            {...register('name')}
            label="Department Name"
            placeholder="e.g., Engineering, Sales, Marketing"
            error={errors.name?.message}
          />
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={!!showAddMember}
        onClose={() => {
          setShowAddMember(null);
          setSelectedUser('');
        }}
        title="Add Member to Department"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddMember(null);
                setSelectedUser('');
              }}
              disabled={isAddingMember}
            >
              Cancel
            </Button>
            <Button onClick={() => showAddMember && handleAddMember(showAddMember)} disabled={isAddingMember}>
              {isAddingMember ? <LoadingSpinner /> : 'Add'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">Select User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={isAddingMember}
            >
              <option value="">Choose a user...</option>
              {users
                ?.filter((user) => {
                  const dept = departments.find((d) => d.id === showAddMember);
                  return !dept?.members?.some((m) => m.id === user.id);
                })
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
