import { LucideIcon } from 'lucide-react';

interface BadgeProps {
  icon?: LucideIcon;
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ icon: Icon, label, variant = 'default', className = '' }: BadgeProps) {
  const variantClasses = {
    default: 'bg-muted text-muted-foreground border-border',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-priority-medium/10 text-priority-medium border-priority-medium/20',
    danger: 'bg-priority-urgent/10 text-priority-urgent border-priority-urgent/20',
    info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${variantClasses[variant]} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </span>
  );
}
