import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Layers,
  Activity,
  Cpu,
  HelpCircle,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Server,
  Play,
  Square,
  Sparkles,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import { SimulatorStatus } from '../types';

interface LeftRailProps {
  selectedMotorId: string;
  simulatorStatus?: SimulatorStatus;
  activeAlertCount?: number;
  onOpenSimulator: () => void;
  onToggleSimulator: () => void;
}

export const LeftRail: React.FC<LeftRailProps> = ({
  selectedMotorId,
  simulatorStatus,
  activeAlertCount = 0,
  onOpenSimulator,
  onToggleSimulator
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('machina_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('machina_theme', 'light');
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('machina_theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('twin_user');
    navigate('/login');
  };

  const navItems = [
    { to: '/fleet', label: 'Fleet Overview', icon: Layers },
    { to: `/motor/${selectedMotorId}`, label: 'Digital Twin', icon: Activity },
    { to: `/diagnosis/${selectedMotorId}`, label: 'Fault Diagnosis', icon: Cpu },
    { to: `/explainability/${selectedMotorId}`, label: 'SHAP Explanations', icon: HelpCircle },
    { to: `/rul/${selectedMotorId}`, label: 'Remaining Life', icon: Clock },
    { to: '/predictions', label: 'AI4I & Benchmark', icon: Sparkles },
    { to: '/alerts', label: 'Maintenance Alerts', icon: AlertTriangle, badge: activeAlertCount },
    { to: '/csv-analysis', label: 'Batch CSV Analysis', icon: FileSpreadsheet },
    { to: '/research', label: 'Research Paper Data', icon: FileText },
    { to: '/status', label: 'Model Quality & Specs', icon: Server },
  ];

  return (
    <>
      {/* Desktop 68px Icon Rail */}
      <aside className="hidden md:flex flex-col items-center w-[68px] min-w-[68px] h-screen sticky top-0 py-4 border-r border-rule bg-bg text-ink z-50 select-none">
        {/* Monogram Brand Mark */}
        <button
          onClick={() => navigate('/')}
          title="MACHINA-X Home"
          className="w-10 h-10 border border-ink grid place-items-center mb-4 font-serif font-bold text-lg hover:bg-track transition-colors cursor-pointer"
        >
          MX
        </button>

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col items-center gap-1.5 w-full px-2" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to.split('/')[1] ? `/${item.to.split('/')[1]}` : item.to);
            return (
              <NavLink
                key={item.label}
                to={item.to}
                title={item.label}
                className={({ isActive: active }) =>
                  `w-10 h-10 rounded grid place-items-center relative text-mute hover:text-ink transition-colors ${
                    active || isActive ? 'bg-track text-ink font-semibold' : ''
                  }`
                }
              >
                <Icon className="w-5 h-5 stroke-[1.6]" />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-bad animate-pulse" />
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Utility Controls */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-rule w-full px-2">
          {/* Simulator status button */}
          <button
            onClick={onToggleSimulator}
            title={simulatorStatus?.isRunning ? 'Stop Telemetry Simulator' : 'Start Telemetry Simulator'}
            className={`w-10 h-10 rounded grid place-items-center transition-colors ${
              simulatorStatus?.isRunning
                ? 'bg-warn text-bg'
                : 'text-mute hover:text-ink hover:bg-track'
            }`}
          >
            {simulatorStatus?.isRunning ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light (Warm Paper)' : 'Dark (Console)'} Mode`}
            className="w-10 h-10 rounded grid place-items-center text-mute hover:text-ink hover:bg-track transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 stroke-[1.6]" /> : <Moon className="w-5 h-5 stroke-[1.6]" />}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Sign Out / Switch User"
            className="w-10 h-10 rounded grid place-items-center text-mute hover:text-bad hover:bg-track transition-colors"
          >
            <LogOut className="w-4 h-4 stroke-[1.6]" />
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (<860px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-bg border-t border-rule z-50 flex items-center justify-around px-2" aria-label="Mobile Navigation">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              title={item.label}
              className={({ isActive }) =>
                `p-2 rounded text-mute hover:text-ink ${isActive ? 'text-ink bg-track' : ''}`
              }
            >
              <Icon className="w-5 h-5 stroke-[1.6]" />
            </NavLink>
          );
        })}
        <button
          onClick={onToggleSimulator}
          className={`p-2 rounded ${simulatorStatus?.isRunning ? 'text-warn' : 'text-mute'}`}
        >
          {simulatorStatus?.isRunning ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button onClick={toggleTheme} className="p-2 rounded text-mute">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </nav>
    </>
  );
};
