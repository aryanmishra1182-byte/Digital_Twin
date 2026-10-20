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
  Square
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
    { to: `/motor/${selectedMotorId}`, label: 'Motor Detail', icon: Activity },
    { to: `/diagnosis/${selectedMotorId}`, label: 'Fault Diagnosis', icon: Cpu },
    { to: `/explainability/${selectedMotorId}`, label: 'SHAP Explainability', icon: Sparkles },
    { to: `/rul/${selectedMotorId}`, label: 'Remaining Useful Life', icon: Clock },
    { to: '/alerts', label: 'Alerts & Maintenance', icon: AlertTriangle },
    { to: '/status', label: 'Model & System Status', icon: Server }
  ];

  return (
    <header className="bg-[#111827] border-b border-[#243247] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-mono font-bold text-lg">
              DT
            </div>
            <div>
              <div className="font-bold text-slate-100 text-sm tracking-wide flex items-center gap-2">
                EXPLAINABLE DIGITAL TWIN
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  IEEE 3kW Motor
                </span>
              </div>
              <div className="text-xs text-slate-400">Predictive Maintenance Framework</div>
            </div>
          </div>

          {/* Center Motor Selector & Simulator Quick Action */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-[#182235] rounded-lg px-3 py-1.5 border border-[#243247] text-xs">
              <span className="text-slate-400 mr-2 font-mono">ASSET:</span>
              <select
                value={selectedMotorId}
                onChange={(e) => onSelectMotor(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="MOTOR-001" className="bg-[#182235]">MOTOR-001 (Feed Pump)</option>
                <option value="MOTOR-002" className="bg-[#182235]">MOTOR-002 (Cooling Fan)</option>
              </select>
            </div>

            {/* Simulator Pill */}
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenSimulator}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  simulatorStatus?.isRunning
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-[#182235] border-[#243247] text-slate-300 hover:border-slate-500'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    simulatorStatus?.isRunning ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span>
                  Sim: {simulatorStatus?.isRunning ? `${simulatorStatus.scenario}` : 'Idle'}
                </span>
              </button>

              <button
                onClick={onToggleSimulator}
                title={simulatorStatus?.isRunning ? 'Stop Simulator' : 'Start Simulator'}
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center transition-colors ${
                  simulatorStatus?.isRunning
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                }`}
              >
                {simulatorStatus?.isRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
