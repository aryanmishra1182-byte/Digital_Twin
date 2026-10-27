import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, ShieldCheck, AlertCircle, RefreshCw, Layers, Play, Square, Radio } from 'lucide-react';
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

  const getBreadcrumb = () => {
    const p = location.pathname;
    if (p === '/' || p.startsWith('/overview')) return { section: 'STATUS BOARD', page: 'Device Status Board' };
    if (p.startsWith('/monitor')) return { section: 'EQUIPMENT', page: 'Digital Twins' };
    if (p.startsWith('/diagnostics')) return { section: 'DIAGNOSTICS', page: 'AI Inference' };
    if (p.startsWith('/data-lab') || p.startsWith('/check')) return { section: 'DATA LAB', page: 'Batch Ingestion' };
    if (p.startsWith('/research') || p.startsWith('/about')) return { section: 'RESEARCH', page: 'Experimental Verification' };
    return { section: 'STATUS BOARD', page: 'Overview' };
  };

  const breadcrumb = getBreadcrumb();
  const isBackendUp = systemStatus?.backendService === 'UP';
  const isMlUp = systemStatus?.mlService?.status === 'UP';
  const isSimRunning = simStatus?.isRunning ?? false;

  return (
    <header className="h-14 px-3 sm:px-6 border-b border-[#1C3B4E] bg-[#0B202C] text-white sticky top-0 z-30 flex items-center justify-between">
      {/* Left: Mobile Menu Trigger + Watson Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-1.5 rounded text-[#718096] hover:text-white hover:bg-[#102A38]"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-[#9B6DCC] uppercase tracking-wider hidden sm:inline">
            {breadcrumb.section}
          </span>
          <span className="text-[#718096] text-xs hidden sm:inline">/</span>
          <h1 className="text-sm font-semibold text-white tracking-wide">
            {breadcrumb.page}
          </h1>
        </div>
      </div>

      {/* Center/Right: Motor Selector, Simulator Toggle, Service Status */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Equipment Selector */}
        {twins.length > 0 && (
          <div className="flex items-center gap-1.5 bg-[#102A38] px-2.5 py-1 rounded border border-[#1C3B4E]">
            <Layers className="w-3.5 h-3.5 text-[#9B6DCC]" />
            <span className="text-[10px] font-mono text-[#718096] uppercase hidden md:inline">Device:</span>
            <select
              value={selectedMotorId}
              onChange={(e) => onSelectMotor(e.target.value)}
              className="bg-transparent text-xs font-mono font-medium text-white focus:outline-none cursor-pointer"
              aria-label="Select equipment"
            >
              {twins.map((t) => (
                <option key={t.motorId} value={t.motorId} className="bg-[#0B202C] text-white">
                  {t.motorId} ({t.operationalState})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Live Simulator Feed Toggle */}
        <button
          type="button"
          onClick={handleToggleSimulator}
          disabled={simLoading}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-all ${
            isSimRunning
              ? 'bg-[#27866F]/20 text-[#27866F] border-[#27866F]/40 hover:bg-[#27866F]/30'
              : 'bg-[#102A38] text-[#718096] border-[#1C3B4E] hover:text-white'
          }`}
          title={isSimRunning ? 'Simulator active (Click to pause feed)' : 'Simulator paused (Click to start feed)'}
        >
          {isSimRunning ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#27866F] animate-pulse" />
              <span className="font-semibold text-[11px]">FEED RUNNING</span>
              <Square className="w-2.5 h-2.5 ml-0.5 fill-current" />
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-[#718096]" />
              <span className="text-[11px]">FEED PAUSED</span>
              <Play className="w-2.5 h-2.5 ml-0.5 fill-current" />
            </>
          )}
        </button>

        {/* Real-time UTC Timestamp */}
        <div className="hidden lg:flex items-center gap-1.5 font-mono text-[11px] text-[#718096] bg-[#102A38] px-2 py-1 rounded border border-[#1C3B4E]">
          <Radio className="w-3 h-3 text-[#9B6DCC]" />
          <span>{currentTime || '00:00:00 UTC'}</span>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded bg-[#102A38] text-[#718096] hover:text-white transition-colors border border-[#1C3B4E]"
            title="Refresh device telemetry"
            aria-label="Refresh telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#9B6DCC]' : ''}`} />
          </button>
        )}

        {/* System Health Status Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono border ${
            isBackendUp && isMlUp
              ? 'bg-[#27866F]/20 text-[#27866F] border-[#27866F]/40'
              : 'bg-[#C94B50]/20 text-[#C94B50] border-[#C94B50]/40'
          }`}
          title={`Backend: ${systemStatus?.backendService || 'DISCONNECTED'} · ML: ${
            systemStatus?.mlService?.status || 'DISCONNECTED'
          }`}
        >
          {isBackendUp && isMlUp ? (
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          )}
          <span className="hidden sm:inline font-semibold text-[11px]">
            {isBackendUp && isMlUp ? 'ONLINE' : 'DEGRADED'}
          </span>
        </div>
      </div>
    </header>
  );
};
