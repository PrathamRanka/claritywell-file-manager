'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, Lock, Users, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Modal, Input, Select } from '@/components/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/utils/zodResolver';
import { createFolderSchema } from '@/lib/validations';
import { z } from 'zod';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils/api';

type CreateFolderForm = z.infer<typeof createFolderSchema>;

interface Folder {
  id: string;
  name: string;
  visibility: string;
  createdBy?: { id: string; name: string };
}

export function FoldersTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingVisibility, setEditingVisibility] = useState<string>('PRIVATE');

  const { data: response, mutate } = useSWR<any>('/api/admin/folders', fetcher);
  const folders: Folder[] = response?.data?.folders || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateFolderForm>({
    resolver: zodResolver(createFolderSchema),
  });

  const onSubmit = async (data: CreateFolderForm) => {
    try {
      await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          visibility: data.visibility || 'PRIVATE',
        }),
      });
      toast.success('Folder created');
      setShowCreate(false);
      reset();
      mutate();
    } catch {
      toast.error('Failed to create folder');
    }
  };

  const handleDelete = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder?')) return;

    try {
      await fetch(`/api/folders/${folderId}`, { method: 'DELETE' });
      toast.success('Folder deleted');
      mutate();
    } catch {
      toast.error('Failed to delete folder');
    }
  };

  const handleUpdateVisibility = async (folderId: string, visibility: string) => {
    try {
      await fetch(`/api/folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility }),
      });
      toast.success(`Folder made ${visibility.toLowerCase()}`);
      setEditingFolder(null);
      mutate();
    } catch {
      toast.error('Failed to update folder visibility');
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'PRIVATE':
        return <Lock className="w-4 h-4" />;
      case 'DEPARTMENT':
        return <Users className="w-4 h-4" />;
      case 'SHARED':
        return <Globe className="w-4 h-4" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'PRIVATE':
        return 'bg-slate-100 text-slate-800';
      case 'DEPARTMENT':
        return 'bg-blue-100 text-blue-800';
      case 'SHARED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)} icon={Plus}>
          Create Folder
        </Button>
      </div>

      {/* Folders list */}
      {folders.length === 0 ? (
        <div className="text-center py-8 bg-muted/30 rounded-lg border border-border">
          <p className="text-muted-foreground">No folders created yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {folders.map((folder) => (
            <div key={folder.id} className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1">
                    <h3 className="font-medium">{folder.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`flex items-center gap-1 ${getVisibilityColor(folder.visibility)}`}>
                        {getVisibilityIcon(folder.visibility)}
                        <span className="text-xs">{folder.visibility}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingFolder === folder.id ? (
                    <div className="flex gap-2">
                      <select
                        value={editingVisibility}
                        onChange={(e) => setEditingVisibility(e.target.value)}
                        className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="PRIVATE">Private</option>
                        <option value="DEPARTMENT">Department</option>
                        <option value="SHARED">Shared (Public)</option>
                      </select>
                      <button
                        onClick={() => handleUpdateVisibility(folder.id, editingVisibility)}
                        className="px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingFolder(null)}
                        className="px-3 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingFolder(folder.id);
                          setEditingVisibility(folder.visibility);
                        }}
                        className="p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="Change visibility"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(folder.id)}
                        className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete folder"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal
          isOpen={showCreate}
          onClose={() => {
            setShowCreate(false);
            reset();
          }}
          title="Create New Folder"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Folder Name</label>
              <Input
                {...register('name')}
                placeholder="Enter folder name"
                error={errors.name?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Visibility</label>
              <Select
                {...register('visibility')}
                options={[
                  { value: 'PRIVATE', label: 'Private - Only you' },
                  { value: 'DEPARTMENT', label: 'Department - Your department members' },
                  { value: 'SHARED', label: 'Shared (Public) - All users' },
                ]}
                error={errors.visibility?.message}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCreate(false);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create Folder</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
