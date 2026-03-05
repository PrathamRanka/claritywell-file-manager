import { Flag, Circle, Clock, CheckCircle, Lock, Users, Building2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export const PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type Priority = keyof typeof PRIORITIES;

export interface PriorityConfig {
  color: string;
  icon: LucideIcon;
  label: string;
}

export const PRIORITY_CONFIG: Record<Priority, PriorityConfig> = {
  LOW: {
    color: 'bg-priority-low/10 text-priority-low border-priority-low/20',
    icon: Flag,
    label: 'Low',
  },
  MEDIUM: {
    color: 'bg-priority-medium/10 text-priority-medium border-priority-medium/20',
    icon: Flag,
    label: 'Medium',
  },
  HIGH: {
    color: 'bg-priority-high/10 text-priority-high border-priority-high/20',
    icon: Flag,
    label: 'High',
  },
  URGENT: {
    color: 'bg-priority-urgent/10 text-priority-urgent border-priority-urgent/20',
    icon: Flag,
    label: 'Urgent',
  },
};

export const STATUSES = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export type Status = keyof typeof STATUSES;

export interface StatusConfig {
  color: string;
  icon: LucideIcon;
  label: string;
}

export const STATUS_CONFIG: Record<Status, StatusConfig> = {
  PENDING: {
    color: 'text-muted-foreground',
    icon: Circle,
    label: 'Pending',
  },
  IN_PROGRESS: {
    color: 'text-blue-500',
    icon: Clock,
    label: 'In Progress',
  },
  COMPLETED: {
    color: 'text-success',
    icon: CheckCircle,
    label: 'Completed',
  },
};

export const VISIBILITY_TYPES = {
  PRIVATE: 'PRIVATE',
  DEPARTMENT: 'DEPARTMENT',
  SHARED: 'SHARED',
} as const;

export type VisibilityType = keyof typeof VISIBILITY_TYPES;

export interface VisibilityConfig {
  icon: LucideIcon;
  label: string;
  description: string;
}

export const VISIBILITY_CONFIG: Record<VisibilityType, VisibilityConfig> = {
  PRIVATE: {
    icon: Lock,
    label: 'Private',
    description: 'Only you can access',
  },
  DEPARTMENT: {
    icon: Building2,
    label: 'Department',
    description: 'Your department can access',
  },
  SHARED: {
    icon: Users,
    label: 'Shared',
    description: 'Shared with specific users',
  },
};

export const DOCUMENT_TYPES = {
  WYSIWYG: 'WYSIWYG',
  IMAGE: 'IMAGE',
  PDF: 'PDF',
  SPREADSHEET: 'SPREADSHEET',
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPES;

export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type Role = keyof typeof ROLES;
