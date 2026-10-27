import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, Server, ShieldCheck, AlertCircle, RefreshCw, Layers, Play, Square, Radio } from 'lucide-react';
import { api } from '../../api/client';
import { SystemStatus, DigitalTwinState, SimulatorStatus } from '../../types';

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
  const [simStatus, setSimStatus] = useState<SimulatorStatus | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [simLoading, setSimLoading] = useState<boolean>(false);

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

  const fetchStatus = () => {
    api
      .getSystemStatus()
      .then((st) => setSystemStatus(st))
      .catch(() => setSystemStatus(null));

    api
      .getSimulatorStatus()
      .then((s) => setSimStatus(s))
      .catch(() => setSimStatus(null));
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSimulator = async () => {
    setSimLoading(true);
    try {
      if (simStatus?.isRunning) {
        const s = await api.stopSimulator();
        setSimStatus(s);
      } else {
        const s = await api.startSimulator(selectedMotorId, 'HEALTHY', 0.5, 100);
        setSimStatus(s);
      }
      if (onRefresh) onRefresh();
    } catch {
      // Ignored
    } finally {
      setSimLoading(false);
    }
  };

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
  const isSimRunning = simStatus?.isRunning ?? false;

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

      {/* Center/Right: Motor Selector, Simulator Toggle, System Health, Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
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

        {/* Live Simulator Stream Toggle Pill */}
        <button
          type="button"
          onClick={handleToggleSimulator}
          disabled={simLoading}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
            isSimRunning
              ? 'bg-state-normal/10 text-state-normal border-state-normal/30 hover:bg-state-normal/20'
              : 'bg-surface-secondary dark:bg-panel-dark-subtle text-ink-muted border-rule dark:border-rule-dark hover:text-ink'
          }`}
          title={isSimRunning ? 'Simulator is streaming live telemetry (Click to pause)' : 'Simulator is paused (Click to start)'}
        >
          {isSimRunning ? (
            <>
              <span className="w-2 h-2 rounded-full bg-state-normal animate-pulse" />
              <span className="font-semibold">STREAMING</span>
              <Square className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100 fill-current" />
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-ink-muted" />
              <span>PAUSED</span>
              <Play className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100 fill-current" />
            </>
          )}
        </button>

        {/* Real-time UTC Clock */}
        <div className="hidden xl:flex items-center gap-1.5 font-mono text-xs text-ink-muted bg-surface-secondary dark:bg-panel-dark-subtle px-2.5 py-1.5 rounded-lg border border-rule dark:border-rule-dark">
          <Radio className="w-3.5 h-3.5 text-telemetry-cyan animate-pulse" />
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
