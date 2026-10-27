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
      icon: LayoutDashboard,
    },
    {
      to: '/monitor',
      label: 'Digital Twins',
      icon: Activity,
    },
    {
      to: '/diagnostics',
      label: 'AI Diagnostics',
      icon: Cpu,
    },
    {
      to: '/data-lab',
      label: 'Data Lab',
      icon: Database,
    },
    {
      to: '/research',
      label: 'Research',
      icon: BookOpen,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Navigation Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-40 flex flex-col justify-between border-r border-[#1C3B4E] bg-[#0B202C] text-slate-200 transition-all duration-200 ease-in-out ${
          collapsed ? 'w-16' : 'w-56'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Sidebar navigation"
      >
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-[#1C3B4E]">
            <NavLink
              to="/"
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 focus:outline-none"
              title="MACHINA-X"
            >
              <div className="w-7 h-7 rounded bg-[#68409A] flex items-center justify-center text-white font-bold text-xs">
                MX
              </div>
              {!collapsed && (
                <span className="font-semibold text-sm tracking-tight text-white">
                  MACHINA-X
                </span>
              )}
            </NavLink>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1" aria-label="Primary Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#1C3B4E] text-white font-semibold'
                        : 'text-slate-400 hover:bg-[#102A38] hover:text-white'
                    } ${collapsed ? 'justify-center px-2' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Collapse Toggle */}
        <div className="p-3 border-t border-[#1C3B4E]">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-[#102A38] transition-colors text-xs"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <span className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
