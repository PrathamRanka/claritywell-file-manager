'use client';

import Link from 'next/link';
import { Calendar, Building2, User, FileText, Plus } from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils/formatters';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { Requirement } from '@/hooks/useRequirement';
import { Button } from '@/components/ui';

interface RequirementHeaderProps {
  requirement: Requirement;
  onCreateDocument: () => void;
}

export function RequirementHeader({ requirement, onCreateDocument }: RequirementHeaderProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 mb-8">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">{requirement.clientName}</h1>
          <p className="text-muted-foreground">Client requirement details and documents</p>
        </div>
        
        <Button onClick={onCreateDocument} icon={Plus}>
          New Document
        </Button>
      </div>

      {/* Requirement metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Department</p>
            <p className="font-medium">{requirement.department.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Due Date</p>
            <p className="font-medium">{formatDate(requirement.dueDate)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <User className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created By</p>
            <p className="font-medium">{requirement.createdBy.name}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Priority</p>
            <PriorityBadge priority={requirement.priority} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <StatusBadge status={requirement.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
