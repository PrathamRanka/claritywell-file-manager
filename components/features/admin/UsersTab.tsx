'use client';

import { useState } from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';
import { toast } from 'sonner';
import { Badge, Button, Modal, Input, Select } from '@/components/ui';
import { User } from '@/hooks/useUsers';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/utils/zodResolver';
import { createUserSchema } from '@/lib/constants/schemas';
import { z } from 'zod';

type CreateUserForm = z.infer<typeof createUserSchema>;

interface UsersTabProps {
  users: User[];
  mutate: () => void;
}

export function UsersTab({ users, mutate }: UsersTabProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
  });

  const onSubmit = async (data: CreateUserForm) => {
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
    setValue('email', user.email);
    setValue('role', user.role as 'USER' | 'ADMIN');
    setShowCreate(true);
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
        <Button onClick={() => setShowCreate(true)} icon={Plus}>
          Create User
        </Button>
      </div>

      {/* Users table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Departments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4">
                    <Badge
                      label={user.role}
                      variant={user.role === 'ADMIN' ? 'info' : 'default'}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.departments.map((dept) => dept.name).join(', ') || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        title="Edit user"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete user"
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          setEditingUserId(null);
          reset();
        }}
        title={editingUserId ? 'Edit User' : 'Create User'}
        footer={
          <>
            <Button 
              variant="secondary" 
              type="button"
              onClick={() => {
                setShowCreate(false);
                setEditingUserId(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="user-form"
            >
              {editingUserId ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="user-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            {...register('name')}
            label="Name"
            placeholder="John Doe"
            error={errors.name?.message}
          />
          <Input
            {...register('email')}
            label="Email"
            type="email"
            placeholder="john@example.com"
            error={errors.email?.message}
            disabled={!!editingUserId}
          />
          {!editingUserId && (
            <Input
              {...register('password')}
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
            />
          )}
          <Select
            {...register('role')}
            label="Role"
            options={[
              { value: 'USER', label: 'User' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
            error={errors.role?.message}
          />
        </form>
      </Modal>
    </div>
  );
}
