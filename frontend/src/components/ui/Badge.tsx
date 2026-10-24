import React from 'react';
import { OperationalState, AlertSeverity, AlertStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  className?: string;
}

export const StateBadge: React.FC<{ state: OperationalState; size?: 'sm' | 'md' }> = ({
  state,
  size = 'md'
}) => {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';
  
  switch (state) {
    case 'HEALTHY':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Operational</span>
        </span>
      );
    case 'WARNING':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Degrading</span>
        </span>
      );
    case 'CRITICAL':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
          <span>Trip Imminent</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>Offline</span>
        </span>
      );
  }
};

export const SeverityBadge: React.FC<{ severity: AlertSeverity }> = ({ severity }) => {
  switch (severity) {
    case 'P1_CRITICAL':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-rose-950/40 text-rose-300 border border-rose-800/50">
          P1 CRITICAL
        </span>
      );
    case 'P2_WARNING':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-amber-950/40 text-amber-300 border border-amber-800/50">
          P2 WARNING
        </span>
      );
    case 'P3_INFO':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-sky-950/40 text-sky-300 border border-sky-800/50">
          P3 ADVISORY
        </span>
      );
  }
};

export const StatusBadge: React.FC<{ status: AlertStatus }> = ({ status }) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Active
        </span>
      );
    case 'ACKNOWLEDGED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Investigating
        </span>
      );
    case 'RESOLVED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Cleared
        </span>
      );
  }
};

export const Tag: React.FC<BadgeProps> = ({ children, className = '' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface text-slate-300 border border-panel-border ${className}`}>
    {children}
  </span>
);
