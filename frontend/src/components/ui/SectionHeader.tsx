import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  tag?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  tag,
  actions,
  className = ''
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-panel-border/60 ${className}`}>
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-100">
            {title}
          </h1>
          {tag && (
            <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-surface border border-panel-border text-slate-300">
              {tag}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
