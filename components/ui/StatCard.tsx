import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({ title, value, icon: Icon, iconColor = 'text-blue-600' }: StatCardProps) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value || '—'}</p>
        </div>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
    </div>
  );
}
