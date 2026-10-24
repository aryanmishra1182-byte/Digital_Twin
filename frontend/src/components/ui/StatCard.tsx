import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  context?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'healthy' | 'warning' | 'critical' | 'brand';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  context,
  icon: Icon,
  variant = 'default',
  className = ''
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'healthy':
        return 'text-emerald-400';
      case 'warning':
        return 'text-amber-400';
      case 'critical':
        return 'text-rose-400';
      case 'brand':
        return 'text-brand-400';
      default:
        return 'text-slate-100';
    }
  };

  return (
    <div className={`bg-panel border border-panel-border/80 rounded-lg p-4 transition-all hover:border-panel-border-strong ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 truncate">
          {label}
        </span>
        {Icon && <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={`text-2xl font-semibold font-mono tracking-tight tabular-nums ${getVariantStyles()}`}>
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono text-slate-400">
            {unit}
          </span>
        )}
      </div>
      {context && (
        <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
          {context}
        </div>
      )}
    </div>
  );
};
