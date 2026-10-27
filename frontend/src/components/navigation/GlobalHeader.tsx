import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { api } from '../../api/client';
import { SystemStatus, DigitalTwinState } from '../../types';

interface GlobalHeaderProps {
  onOpenMobile: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  selectedMotorId?: string;
  onSelectMotor?: (id: string) => void;
  twins?: DigitalTwinState[];
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  onOpenMobile,
}) => {
  const location = useLocation();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  const fetchStatus = () => {
    api
      .getSystemStatus()
      .then((st) => setSystemStatus(st))
      .catch(() => setSystemStatus(null));
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    const p = location.pathname;
    if (p === '/' || p.startsWith('/overview')) return 'Overview';
    if (p.startsWith('/monitor')) return 'Digital Twins';
    if (p.startsWith('/diagnostics')) return 'AI Diagnostics';
    if (p.startsWith('/data-lab') || p.startsWith('/check')) return 'Data Lab';
    if (p.startsWith('/research') || p.startsWith('/about')) return 'Research';
    return 'Overview';
  };

  const isConnected = systemStatus?.backendService === 'UP';

  return (
    <header className="h-14 px-4 sm:px-6 border-b border-[#1C3B4E] bg-[#0B202C] text-slate-200 sticky top-0 z-30 flex items-center justify-between">
      {/* Left: Mobile trigger & Page breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#102A38]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">MACHINA-X</span>
          <span className="text-slate-600 text-xs">/</span>
          <h1 className="text-sm font-semibold text-white">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Small connection-status indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#102A38] border border-[#1C3B4E] text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          <span className="text-slate-300 font-medium text-[11px]">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </header>
  );
};
