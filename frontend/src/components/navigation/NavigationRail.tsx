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
      label: 'Device Status Board',
      sublabel: 'Overview',
      icon: LayoutDashboard,
      shortcut: '1',
    },
    {
      to: '/monitor',
      label: 'Digital Twins',
      sublabel: 'Equipment & Sensors',
      icon: Activity,
      shortcut: '2',
    },
    {
      to: '/diagnostics',
      label: 'AI Diagnostics',
      sublabel: 'Inference & SHAP',
      icon: Cpu,
      shortcut: '3',
    },
    {
      to: '/data-lab',
      label: 'Data Lab',
      sublabel: 'CSV Ingestion & AI4I',
      icon: Database,
      shortcut: '4',
    },
    {
      to: '/research',
      label: 'Research & Evidence',
      sublabel: 'Benchmarks & Metrics',
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
        className={`fixed lg:sticky top-0 h-screen z-40 flex flex-col justify-between border-r border-[#1C3B4E] bg-[#0B202C] text-[#F4F7FB] transition-all duration-200 ease-in-out ${
          collapsed ? 'w-[70px]' : 'w-[230px]'
        } ${
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Top: Identity / Brand */}
        <div className="flex flex-col">
          <div className="h-14 flex items-center justify-between px-3.5 border-b border-[#1C3B4E]">
            <NavLink
              to="/"
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 group focus:outline-none"
              title="MACHINA-X Device Status Board"
            >
              {/* Watson-style Geometric Industrial Logo */}
              <div className="w-8 h-8 rounded bg-[#68409A] flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-inner">
                MX
              </div>

              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs tracking-wider text-white">
                      MACHINA<span className="text-[#9B6DCC]">-X</span>
                    </span>
                    <span className="px-1 py-0.2 text-[9px] font-mono font-medium rounded bg-[#102A38] text-[#9B6DCC] border border-[#1C3B4E]">
                      IoT
                    </span>
                  </div>
                  <span className="text-[10px] text-[#718096] uppercase tracking-wider font-mono">
                    Device Board
                  </span>
                </div>
              )}
            </NavLink>
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-1 mt-1.5" aria-label="Primary Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#68409A] text-white font-semibold shadow-sm'
                        : 'text-[#94A3B8] hover:bg-[#102A38] hover:text-white'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                  title={collapsed ? `${item.label} (${item.sublabel})` : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? 'text-white' : 'text-[#718096] group-hover:text-white'
                        }`}
                      />
                      {!collapsed && (
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate leading-tight">{item.label}</span>
                          <span
                            className={`text-[10px] truncate ${
                              isActive ? 'text-white/80' : 'text-[#718096]'
                            }`}
                          >
                            {item.sublabel}
                          </span>
                        </div>
                      )}

                      {/* Tooltip on collapsed rail */}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded bg-[#0B202C] text-white text-xs font-normal whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50 border border-[#1C3B4E]">
                          {item.label}
                          <span className="block text-[10px] text-[#718096]">{item.sublabel}</span>
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Feed Source + Collapse Toggle */}
        <div className="p-2.5 border-t border-[#1C3B4E] space-y-2">
          {!collapsed ? (
            <div className="p-2 rounded bg-[#102A38] border border-[#1C3B4E] text-[11px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono uppercase tracking-wider text-[#718096]">
                  FEED STATUS
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#27866F] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#27866F]"></span>
                </span>
              </div>
              <div className="font-mono font-semibold text-white flex items-center gap-1.5 text-xs">
                <Radio className="w-3.5 h-3.5 text-[#27866F]" />
                <span>ONLINE SIM</span>
              </div>
              <div className="text-[10px] text-[#718096] mt-0.5 font-mono">
                IEEE 112 3kW Spec
              </div>
            </div>
          ) : (
            <div
              className="flex justify-center py-1.5"
              title="Stream: SIMULATED TELEMETRY (10 kHz IEEE 112)"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#27866F] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#27866F]"></span>
              </span>
            </div>
          )}

          {/* Desktop Rail Collapse Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex w-full items-center justify-center p-1.5 rounded text-[#718096] hover:text-white hover:bg-[#102A38] transition-colors text-xs font-mono"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <span className="flex items-center gap-1.5 text-[11px]">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Collapse Rail</span>
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
