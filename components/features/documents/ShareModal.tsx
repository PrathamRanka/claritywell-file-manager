'use client';

import { useState } from 'react';
import { Modal, Button, Input } from '@/components/ui';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVisibility: 'PRIVATE' | 'DEPARTMENT' | 'SHARED' | 'PUBLIC';
  onShare: (visibility: 'PRIVATE' | 'DEPARTMENT' | 'SHARED') => void;
}

export function ShareModal({ isOpen, onClose, onShare, currentVisibility }: ShareModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'DEPARTMENT' | 'SHARED'>(
    currentVisibility === 'PUBLIC' ? 'SHARED' : currentVisibility
  );

  const handleShare = () => {
    onShare(visibility);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Document"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleShare}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Visibility</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as 'PRIVATE' | 'DEPARTMENT' | 'SHARED')}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="PRIVATE">Private</option>
            <option value="DEPARTMENT">Department</option>
            <option value="SHARED">Shared (Public)</option>
          </select>
        </div>

        <Input
          type="search"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">Search users for ACL sharing (advanced controls coming next)</p>
      </div>
    </Modal>
  );
}
