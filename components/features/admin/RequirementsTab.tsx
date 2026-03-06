'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/formatters';
import { toast } from 'sonner';
import { Button, Modal, Input, Select } from '@/components/ui';
import { Pagination } from '@/components/ui/Pagination';
import { Requirement } from '@/hooks/useRequirement';
import { Department } from '@/hooks/useDepartments';
import { PriorityBadge } from '../requirements/PriorityBadge';
import { StatusBadge } from '../requirements/StatusBadge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/utils/zodResolver';
import { createRequirementSchema } from '@/lib/constants/schemas';
import { z } from 'zod';

type CreateRequirementForm = z.infer<typeof createRequirementSchema>;

interface RequirementsTabProps {
  requirements: Requirement[];
  departments: Department[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  mutate: () => void;
}

export function RequirementsTab({ requirements, departments, page, totalPages, onPageChange, mutate }: RequirementsTabProps) {
  const [showCreate, setShowCreate] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateRequirementForm>({
    resolver: zodResolver(createRequirementSchema),
  });

  const onSubmit = async (data: CreateRequirementForm) => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)} icon={Plus}>
          Create Requirement
        </Button>
      </div>

      {/* Requirements table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requirements.map((req) => (
                <tr key={req.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/requirements/${req.id}`}
                      className="font-medium hover:text-accent transition-colors"
                    >
                      {req.clientName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm">{req.department.name}</td>
                  <td className="px-6 py-4">
                    <PriorityBadge priority={req.priority} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(req.dueDate)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/requirements/${req.id}`}
                      className="text-sm text-accent hover:text-accent-hover font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        title="Create Requirement"
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
            {...register('clientName')}
            label="Client Name"
            placeholder="Acme Corporation"
            error={errors.clientName?.message}
          />
          <Input
            {...register('dueDate')}
            label="Due Date"
            type="date"
            error={errors.dueDate?.message}
          />
          <Select
            {...register('priority')}
            label="Priority"
            options={[
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'URGENT', label: 'Urgent' },
            ]}
            error={errors.priority?.message}
          />
          <Select
            {...register('departmentId')}
            label="Department"
            options={[
              { value: '', label: 'Select a department' },
              ...departments.map((dept) => ({
                value: dept.id,
                label: dept.name,
              })),
            ]}
            error={errors.departmentId?.message}
          />
        </form>
      </Modal>
    </div>
  );
}
