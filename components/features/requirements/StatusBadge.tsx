"use client";

import { Circle } from "lucide-react";
import { STATUS_CONFIG, Status } from "@/lib/constants/config";

interface StatusBadgeProps {
  status: Status | string;
}

const FALLBACK_CONFIG = {
  color: "text-muted-foreground",
  icon: Circle,
  label: "Unknown",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as Status] ?? FALLBACK_CONFIG;

  return (
    <span className={`inline-flex items-center gap-1.5 ${config.color}`}>
      <config.icon className="w-4 h-4" />
      <span className="font-medium">{config.label}</span>
    </span>
  );
}
