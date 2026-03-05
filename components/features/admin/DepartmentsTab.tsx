'use client';

import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Modal, Input } from '@/components/ui';
import { Department } from '@/hooks/useDepartments';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDepartmentSchema } from '@/lib/constants/schemas';
import { z } from 'zod';

type CreateDepartmentForm = z.infer<typeof createDepartmentSchema>;

interface DepartmentsTabProps {
  departments: Department[];
  mutate: () => void;
}

export function DepartmentsTab({ departments, mutate }: DepartmentsTabProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());

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
                    <p className="text-sm text-muted-foreground">
                      {dept.members?.length || 0} members
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(dept.id)}
                  className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Delete department"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {isExpanded && dept.members && dept.members.length > 0 && (
                <div className="border-t border-border p-4 bg-muted/30">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Members
                  </h4>
                  <div className="space-y-2">
                    {dept.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
    </div>
  );
}
