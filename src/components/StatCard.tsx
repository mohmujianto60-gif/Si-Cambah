import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

const colorMap = {
  blue: {
    bg: 'bg-gradient-to-br from-cyan-50 to-sky-50',
    icon: 'bg-gradient-to-br from-cyan-500 to-sky-500',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    icon: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    icon: 'bg-gradient-to-br from-amber-400 to-orange-400',
    border: 'border-amber-200',
    text: 'text-amber-700',
  },
  red: {
    bg: 'bg-gradient-to-br from-rose-50 to-pink-50',
    icon: 'bg-gradient-to-br from-rose-500 to-pink-500',
    border: 'border-rose-200',
    text: 'text-rose-700',
  },
};

export default function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`${c.bg} rounded-2xl border ${c.border} p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className={`text-2xl sm:text-3xl font-bold ${c.text}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 ${c.icon} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
