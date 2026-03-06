'use client';

import { useState } from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';
import { toast } from 'sonner';
import { Badge, Button, Modal, Input, Select } from '@/components/ui';
import { Pagination } from '@/components/ui/Pagination';
import { User } from '@/hooks/useUsers';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/utils/zodResolver';
import { createUserSchema, updateUserSchema } from '@/lib/validations';
import { z } from 'zod';

type CreateUserForm = z.infer<typeof createUserSchema>;
type UpdateUserForm = z.infer<typeof updateUserSchema>;

interface UsersTabProps {
  users: User[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  mutate: () => void;
}

export function UsersTab({ users, page, totalPages, onPageChange, mutate }: UsersTabProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const createForm = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
  });

  const editForm = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
  });

  const onSubmitCreate = async (data: CreateUserForm) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create user');
      }
      
      toast.success('User created');
      setShowCreate(false);
      createForm.reset();
      mutate();
    } catch (error) {
      console.error('User creation error:', error);
      toast.error('Failed to create user');
    }
  };

  const onSubmitEdit = async (data: UpdateUserForm) => {
    if (!editingUserId) return;
    
    try {
      const res = await fetch(`/api/users/${editingUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, role: data.role }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update user');
      }
      
      toast.success('User updated');
      setEditingUserId(null);
      setShowCreate(false);
      editForm.reset();
      mutate();
    } catch (error) {
      console.error('User update error:', error);
      toast.error('Failed to update user');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUserId(user.id);
    editForm.setValue('name', user.name);
    editForm.setValue('role', user.role as 'USER' | 'ADMIN');
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

  const handleCloseModal = () => {
    setShowCreate(false);
    setEditingUserId(null);
    createForm.reset();
    editForm.reset();
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
      
      <Pagination 
        currentPage={page} 
        totalPages={totalPages} 
        onPageChange={onPageChange} 
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreate}
        onClose={handleCloseModal}
        title={editingUserId ? 'Edit User' : 'Create User'}
        footer={
          <>
            <Button 
              variant="secondary" 
              type="button"
              onClick={handleCloseModal}
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
        {editingUserId ? (
          <form 
            id="user-form" 
            className="space-y-4" 
            onSubmit={editForm.handleSubmit(onSubmitEdit)}
          >
            <Input
              {...editForm.register('name')}
              label="Name"
              placeholder="John Doe"
              error={editForm.formState.errors.name?.message}
            />
            <Select
              {...editForm.register('role')}
              label="Role"
              options={[
                { value: 'USER', label: 'User' },
                { value: 'ADMIN', label: 'Admin' },
              ]}
              error={editForm.formState.errors.role?.message}
            />
          </form>
        ) : (
          <form 
            id="user-form" 
            className="space-y-4" 
            onSubmit={createForm.handleSubmit(onSubmitCreate)}
          >
            <Input
              {...createForm.register('name')}
              label="Name"
              placeholder="John Doe"
              error={createForm.formState.errors.name?.message}
            />
            <Input
              {...createForm.register('email')}
              label="Email"
              type="email"
              placeholder="john@example.com"
              error={createForm.formState.errors.email?.message}
            />
            <Input
              {...createForm.register('password')}
              label="Password"
              type="password"
              placeholder="••••••••"
              error={createForm.formState.errors.password?.message}
            />
            <Select
              {...createForm.register('role')}
              label="Role"
              options={[
                { value: 'USER', label: 'User' },
                { value: 'ADMIN', label: 'Admin' },
              ]}
              error={createForm.formState.errors.role?.message}
            />
          </form>
        )}
      </Modal>
    </div>
  );
}
