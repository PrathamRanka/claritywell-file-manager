'use client';

import { VISIBILITY_CONFIG, VisibilityType } from '@/lib/constants/config';
import { Lock } from 'lucide-react';

interface VisibilityBadgeProps {
  visibility: VisibilityType;
}

export function VisibilityBadge({ visibility }: VisibilityBadgeProps) {
  const config = VISIBILITY_CONFIG[visibility];

  // Fallback if visibility is invalid or undefined
  if (!config) {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <Lock className="w-4 h-4" />
        <span className="text-sm">Private</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <config.icon className="w-4 h-4" />
      <span className="text-sm">{config.label}</span>
    </span>
  );
}
