'use client';

import { VISIBILITY_CONFIG, VisibilityType } from '@/lib/constants/config';

interface VisibilityBadgeProps {
  visibility: VisibilityType;
}

export function VisibilityBadge({ visibility }: VisibilityBadgeProps) {
  const config = VISIBILITY_CONFIG[visibility];

  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <config.icon className="w-4 h-4" />
      <span className="text-sm">{config.label}</span>
    </span>
  );
}
