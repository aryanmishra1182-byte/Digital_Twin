import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Monitor } from './pages/Monitor';
import { CheckFile } from './pages/CheckFile';
import { About } from './pages/About';

export const App: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('mx_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mx_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mx_theme', 'light');
    }
  }, [isDark]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg text-ink flex flex-col transition-colors duration-200">
        {/* Slim Header */}
        <header className="border-b border-rule bg-panel/80 backdrop-blur sticky top-0 z-30">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            {/* Logo Mark */}
            <NavLink to="/" className="flex items-center gap-2 group select-none">
              <span className="w-8 h-8 rounded border border-ink flex items-center justify-center font-serif font-bold text-sm bg-panel text-ink group-hover:bg-ink group-hover:text-bg transition-colors">
                MX
              </span>
              <span className="font-serif font-medium text-base tracking-tight hidden xs:inline">
                MACHINA-X
              </span>
            </NavLink>

            {/* Three Text Tabs */}
            <nav className="flex items-center gap-1 sm:gap-2 text-sm font-medium" aria-label="Main Navigation">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `min-h-[44px] px-3 sm:px-4 py-2.5 rounded transition-colors inline-flex items-center ${
                    isActive ? 'font-semibold text-ink border-b-2 border-ink' : 'text-mute hover:text-ink'
                  }`
                }
              >
                Monitor
              </NavLink>
              <NavLink
                to="/check"
                className={({ isActive }) =>
                  `min-h-[44px] px-3 sm:px-4 py-2.5 rounded transition-colors inline-flex items-center ${
                    isActive ? 'font-semibold text-ink border-b-2 border-ink' : 'text-mute hover:text-ink'
                  }`
                }
              >
                Check a file
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `min-h-[44px] px-3 sm:px-4 py-2.5 rounded transition-colors inline-flex items-center ${
                    isActive ? 'font-semibold text-ink border-b-2 border-ink' : 'text-mute hover:text-ink'
                  }`
                }
              >
                About
              </NavLink>
            </nav>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="min-h-[44px] min-w-[44px] px-3 py-2 rounded border border-rule hover:border-ink text-xs font-mono transition-colors inline-flex items-center justify-center"
            >
              {isDark ? 'Light' : 'Dark'}
            </button>
          </div>
        </header>

        {/* Centered Main Column (max-w-3xl = 48rem) */}
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 pb-12">
          <Routes>
            <Route path="/" element={<Monitor />} />
            <Route path="/check" element={<CheckFile />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* One-Line Footer */}
        <footer className="border-t border-rule py-4 text-center text-xs text-mute px-4">
          Advice only. This tool never switches a motor off. Demo readings are simulated.
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
