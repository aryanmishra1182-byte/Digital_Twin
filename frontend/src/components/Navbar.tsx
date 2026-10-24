import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  Layers,
  Cpu,
  AlertTriangle,
  Clock,
  Sparkles,
  Server,
  Play,
  Square,
  Radio,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { SimulatorStatus } from '../types';

interface NavbarProps {
  simulatorStatus?: SimulatorStatus;
  selectedMotorId: string;
  onSelectMotor: (id: string) => void;
  onOpenSimulator: () => void;
  onToggleSimulator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  simulatorStatus,
  selectedMotorId,
  onSelectMotor,
  onOpenSimulator,
  onToggleSimulator
}) => {
  const navItems = [
    { to: '/', label: 'Fleet Overview', icon: Layers },
    { to: `/motor/${selectedMotorId}`, label: 'Live Telemetry', icon: Activity },
    { to: `/diagnosis/${selectedMotorId}`, label: 'Fault Diagnostics', icon: Cpu },
    { to: `/explainability/${selectedMotorId}`, label: 'SHAP Attribution', icon: Sparkles },
    { to: `/rul/${selectedMotorId}`, label: 'Remaining Life (RUL)', icon: Clock },
    { to: '/alerts', label: 'Maintenance Alerts', icon: AlertTriangle },
    { to: '/status', label: 'Models & Provenance', icon: Server }
  ];

  const scenarioLabels: Record<string, string> = {
    HEALTHY: 'Healthy Baseline',
    BROKEN_ROTOR_BAR: 'Broken Rotor Bar',
    STATOR_INTER_TURN_SHORT: 'Stator Turn Short',
    BEARING_DEFECT: 'Bearing Defect',
    AIR_GAP_ECCENTRICITY: 'Air-Gap Eccentricity'
  };

  return (
    <header className="bg-canvas border-b border-panel-border/80 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 border-b border-panel-border/40">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-brand-600/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Activity className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm tracking-tight text-slate-100">
                TwinSync
              </span>
              <span className="hidden sm:inline text-xs text-slate-400 font-normal">
                Induction Motor Digital Twin
              </span>
              <span className="hidden md:inline font-mono text-[10px] text-slate-400 px-1.5 py-0.2 border border-panel-border rounded bg-surface">
                IEEE 3kW · 415V
              </span>
            </div>
          </div>

          {/* Right Controls: Asset Selector & Simulator Workbench */}
          <div className="flex items-center gap-2.5">
            {/* Asset Selector */}
            <div className="relative flex items-center bg-panel border border-panel-border rounded-md px-2.5 py-1 text-xs transition-colors hover:border-panel-border-strong">
              <span className="text-[10px] uppercase font-mono text-slate-400 mr-2">Asset:</span>
              <select
                aria-label="Select Monitored Motor Asset"
                value={selectedMotorId}
                onChange={(e) => onSelectMotor(e.target.value)}
                className="bg-transparent text-slate-200 font-mono font-medium focus:outline-none cursor-pointer pr-4 appearance-none"
              >
                <option value="MOTOR-001" className="bg-panel text-slate-200">MOTOR-001 (Feed Pump)</option>
                <option value="MOTOR-002" className="bg-panel text-slate-200">MOTOR-002 (Cooling Fan)</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
            </div>

            {/* Live Telemetry / Simulator Status */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenSimulator}
                title="Configure Telemetry Simulator Parameters"
                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                  simulatorStatus?.isRunning
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                    : 'bg-panel border-panel-border text-slate-300 hover:border-panel-border-strong'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    simulatorStatus?.isRunning ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
                  }`}
                />
                <span className="hidden sm:inline font-mono text-[11px]">
                  {simulatorStatus?.isRunning
                    ? `Sim: ${scenarioLabels[simulatorStatus.scenario] || simulatorStatus.scenario}`
                    : 'Telemetry: Live'}
                </span>
                <span className="sm:hidden font-mono text-[11px]">
                  {simulatorStatus?.isRunning ? 'Sim Active' : 'Live'}
                </span>
                <SlidersHorizontal className="w-3 h-3 text-slate-400" />
              </button>

              <button
                onClick={onToggleSimulator}
                title={simulatorStatus?.isRunning ? 'Pause Telemetry Simulator' : 'Start Telemetry Simulation'}
                className={`p-1.5 rounded-md border text-xs font-semibold flex items-center justify-center transition-all ${
                  simulatorStatus?.isRunning
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-300 hover:bg-rose-900/50'
                    : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50'
                }`}
              >
                {simulatorStatus?.isRunning ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 -mb-px scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-surface text-slate-100 font-semibold border border-panel-border shadow-subtle'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface/50 border border-transparent'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
