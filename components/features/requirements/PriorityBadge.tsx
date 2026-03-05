'use client';

import { PRIORITY_CONFIG, Priority } from '@/lib/constants/config';
import { Badge } from '@/components/ui';

interface PriorityBadgeProps {
  priority: Priority;
  showLabel?: boolean;
}

export function PriorityBadge({ priority, showLabel = true }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}
    >
      <config.icon className="w-4 h-4" />
      {showLabel && config.label}
    </span>
  );
}
