'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Modal, Button, Input } from '@/components/ui';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
}

export function ShareModal({ isOpen, onClose, onShare }: ShareModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

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
          <Button onClick={onShare}>Share</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          type="search"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">Search for users to grant access</p>
      </div>
    </Modal>
  );
}
