import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, Server, ShieldCheck, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { api } from '../../api/client';
import { SystemStatus, DigitalTwinState } from '../../types';

interface GlobalHeaderProps {
  onOpenMobile: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  selectedMotorId: string;
  onSelectMotor: (id: string) => void;
  twins: DigitalTwinState[];
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  onOpenMobile,
  isDark,
  onToggleTheme,
  selectedMotorId,
  onSelectMotor,
  twins,
  isRefreshing,
  onRefresh,
}) => {
  const location = useLocation();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' UTC'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchStatus = () => {
      api
        .getSystemStatus()
        .then((st) => {
          if (mounted) setSystemStatus(st);
        })
        .catch(() => {
          if (mounted) setSystemStatus(null);
        });
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Compute breadcrumb title based on path
  const getBreadcrumb = () => {
    const p = location.pathname;
    if (p === '/' || p.startsWith('/overview')) return { section: 'MISSION CONTROL', page: 'Overview' };
    if (p.startsWith('/monitor')) return { section: 'EQUIPMENT INTELLIGENCE', page: 'Sensor Monitor' };
    if (p.startsWith('/diagnostics')) return { section: 'EXPLAINABLE AI', page: 'Diagnostics & SHAP' };
    if (p.startsWith('/data-lab') || p.startsWith('/check')) return { section: 'INGESTION WORKSPACE', page: 'Data Lab & AI4I' };
    if (p.startsWith('/research') || p.startsWith('/about')) return { section: 'RESEARCH EVIDENCE', page: 'Scientific Methodology' };
    return { section: 'MISSION CONTROL', page: 'System' };
  };

  const breadcrumb = getBreadcrumb();
  const isBackendUp = systemStatus?.backendService === 'UP';
  const isMlUp = systemStatus?.mlService?.status === 'UP';

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-rule dark:border-rule-dark bg-panel/90 dark:bg-panel-dark/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between transition-colors">
      {/* Left: Mobile Menu Trigger + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-ink-secondary hover:text-ink dark:hover:text-ink-inverse hover:bg-surface-secondary dark:hover:bg-panel-dark-subtle"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-muted">
            <span className="uppercase tracking-wider">{breadcrumb.section}</span>
            <span>/</span>
            <span className="font-semibold text-aerospace dark:text-aerospace-bright">
              {breadcrumb.page}
            </span>
          </div>
          <h1 className="text-sm font-semibold text-ink dark:text-ink-inverse hidden sm:block">
            {breadcrumb.page === 'Overview' && 'Operational Command Center'}
            {breadcrumb.page === 'Sensor Monitor' && 'Induction Motor Deep-Dive Telemetry'}
            {breadcrumb.page === 'Diagnostics & SHAP' && 'Multi-Stage Inference & TreeSHAP Attribution'}
            {breadcrumb.page === 'Data Lab & AI4I' && 'Batch Data Ingestion & Benchmark Validation'}
            {breadcrumb.page === 'Scientific Methodology' && 'Empirical Verification & Cyber-Physical Pipeline'}
          </h1>
        </div>
      </div>

      {/* Center/Right: Motor Selector, Data Source, System Health, Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Motor Selector Dropdown */}
        {twins.length > 0 && (
          <div className="hidden md:flex items-center gap-2 bg-surface-secondary dark:bg-panel-dark-subtle px-2.5 py-1.5 rounded-lg border border-rule dark:border-rule-dark">
            <Layers className="w-3.5 h-3.5 text-aerospace" />
            <span className="text-[11px] font-mono text-ink-muted uppercase">Equipment:</span>
            <select
              value={selectedMotorId}
              onChange={(e) => onSelectMotor(e.target.value)}
              className="bg-transparent text-xs font-mono font-medium text-ink dark:text-ink-inverse focus:outline-none cursor-pointer"
              aria-label="Select equipment"
            >
              {twins.map((t) => (
                <option key={t.motorId} value={t.motorId} className="bg-panel dark:bg-panel-dark">
                  {t.motorId} ({t.operationalState})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Real-time UTC Clock */}
        <div className="hidden xl:flex items-center gap-1.5 font-mono text-xs text-ink-muted bg-surface-secondary dark:bg-panel-dark-subtle px-2.5 py-1.5 rounded-lg border border-rule dark:border-rule-dark">
          <span className="w-1.5 h-1.5 rounded-full bg-telemetry-cyan animate-pulse"></span>
          <span>{currentTime || '12:00:00 UTC'}</span>
        </div>

        {/* Manual Refresh Button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg text-ink-secondary hover:text-ink dark:hover:text-ink-inverse hover:bg-surface-secondary dark:hover:bg-panel-dark-subtle transition-colors border border-rule dark:border-rule-dark"
            title="Refresh live telemetry"
            aria-label="Refresh telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-aerospace' : ''}`} />
          </button>
        )}

        {/* System Health Indicator Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
            isBackendUp && isMlUp
              ? 'bg-state-normal-pale text-state-normal border-state-normal/30 dark:bg-state-normal/10'
              : 'bg-state-critical-pale text-state-critical border-state-critical/30 dark:bg-state-critical/10'
          }`}
          title={`Backend: ${systemStatus?.backendService || 'DISCONNECTED'} · ML Service: ${
            systemStatus?.mlService?.status || 'DISCONNECTED'
          }`}
        >
          {isBackendUp && isMlUp ? (
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          )}
          <span className="hidden sm:inline font-semibold">
            {isBackendUp && isMlUp ? 'SYSTEM NORMAL' : 'SERVICE DEGRADED'}
          </span>
          <span className="text-[10px] opacity-75 hidden md:inline">
            [API {isBackendUp ? 'UP' : 'ERR'} · ML {isMlUp ? 'UP' : 'ERR'}]
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-lg text-ink-secondary hover:text-ink dark:hover:text-ink-inverse hover:bg-surface-secondary dark:hover:bg-panel-dark-subtle transition-colors border border-rule dark:border-rule-dark"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-ink" />}
        </button>
      </div>
    </header>
  );
};
