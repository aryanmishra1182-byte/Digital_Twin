import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Cpu,
  Database,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Radio,
  FileCheck2,
} from 'lucide-react';

interface NavigationRailProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    {
      to: '/',
      label: 'Overview',
      sublabel: 'Mission Control',
      icon: LayoutDashboard,
      shortcut: '1',
    },
    {
      to: '/monitor',
      label: 'Equipment Monitor',
      sublabel: 'Sensor Telemetry',
      icon: Activity,
      shortcut: '2',
    },
    {
      to: '/diagnostics',
      label: 'AI Diagnostics',
      sublabel: 'XGBoost & TreeSHAP',
      icon: Cpu,
      shortcut: '3',
    },
    {
      to: '/data-lab',
      label: 'Data Lab',
      sublabel: 'Validation & AI4I',
      icon: Database,
      shortcut: '4',
    },
    {
      to: '/research',
      label: 'Research & Science',
      sublabel: 'Empirical Verification',
      icon: BookOpen,
      shortcut: '5',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Navigation Rail Container */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-40 flex flex-col justify-between border-r border-rule dark:border-rule-dark bg-panel dark:bg-panel-dark transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-[230px]'
        } ${
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Top: Identity / Brand */}
        <div className="flex flex-col">
          <div className="h-16 flex items-center justify-between px-4 border-b border-rule dark:border-rule-dark">
            <NavLink
              to="/"
              onClick={onCloseMobile}
              className="flex items-center gap-3 group focus:outline-none"
              title="MACHINA-X Mission Control"
            >
              {/* Custom SVG Aerospace Rotor Logo */}
              <div className="w-9 h-9 rounded-lg bg-aerospace/10 dark:bg-aerospace-pale-dark border border-aerospace/30 flex items-center justify-center text-aerospace transition-transform group-hover:scale-105">
                <svg
                  className="w-5 h-5 text-aerospace"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Outer stator ring */}
                  <circle cx="12" cy="12" r="9" className="opacity-40" strokeDasharray="3 3" />
                  {/* Center shaft */}
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                  {/* 3 Stator flux poles */}
                  <path d="M12 3v3" />
                  <path d="M12 18v3" />
                  <path d="M4.2 7.5l2.6 1.5" />
                  <path d="M17.2 15l2.6 1.5" />
                  <path d="M4.2 16.5l2.6-1.5" />
                  <path d="M17.2 9l2.6-1.5" />
                </svg>
              </div>

              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-wider text-ink dark:text-ink-inverse">
                      MACHINA<span className="text-aerospace">-X</span>
                    </span>
                    <span className="px-1.5 py-0.2 text-[9px] font-mono font-semibold rounded bg-aerospace/10 dark:bg-aerospace-pale-dark text-aerospace border border-aerospace/20">
                      v2.4
                    </span>
                  </div>
                  <span className="text-[10px] text-ink-muted uppercase tracking-wider font-mono">
                    Digital Twin
                  </span>
                </div>
              )}
            </NavLink>
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-1 mt-2" aria-label="Primary Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-aerospace text-white shadow-sm font-semibold'
                        : 'text-ink-secondary dark:text-ink-muted hover:bg-surface-secondary dark:hover:bg-panel-dark-subtle hover:text-ink dark:hover:text-ink-inverse'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                  title={collapsed ? `${item.label} (${item.sublabel})` : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-transform ${
                          isActive ? 'text-white scale-110' : 'text-ink-muted group-hover:text-aerospace'
                        }`}
                      />
                      {!collapsed && (
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate leading-tight">{item.label}</span>
                          <span
                            className={`text-[10px] truncate ${
                              isActive ? 'text-white/80' : 'text-ink-muted'
                            }`}
                          >
                            {item.sublabel}
                          </span>
                        </div>
                      )}

                      {/* Tooltip on collapsed rail */}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-md bg-panel-dark text-ink-inverse text-xs font-normal whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md z-50 border border-rule-dark">
                          {item.label}
                          <span className="block text-[10px] text-ink-muted">{item.sublabel}</span>
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Telemetry Mode Badge + Collapse Toggle */}
        <div className="p-3 border-t border-rule dark:border-rule-dark space-y-2">
          {!collapsed ? (
            <div className="p-2.5 rounded-lg bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark text-[11px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                  Stream Source
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-state-normal opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-state-normal"></span>
                </span>
              </div>
              <div className="font-mono font-semibold text-ink dark:text-ink-inverse flex items-center gap-1.5 text-xs">
                <Radio className="w-3.5 h-3.5 text-state-normal" />
                <span>SIMULATED FEED</span>
              </div>
              <div className="text-[10px] text-ink-muted mt-0.5">
                IEEE 112 3kW Spec · 10 kHz
              </div>
            </div>
          ) : (
            <div
              className="flex justify-center py-2"
              title="Stream: SIMULATED TELEMETRY (10 kHz IEEE 112)"
            >
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-state-normal opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-state-normal"></span>
              </span>
            </div>
          )}

          {/* Desktop Rail Collapse Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-lg text-ink-muted hover:text-ink dark:hover:text-ink-inverse hover:bg-surface-secondary dark:hover:bg-panel-dark-subtle transition-colors text-xs font-mono"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <span className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Panel</span>
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
