import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NavigationRail } from './components/navigation/NavigationRail';
import { GlobalHeader } from './components/navigation/GlobalHeader';
import { ToastProvider } from './context/ToastContext';
import { OverviewPage } from './pages/OverviewPage';
import { EquipmentMonitorPage } from './pages/EquipmentMonitorPage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { DataLabPage } from './pages/DataLabPage';
import { ResearchPage } from './pages/ResearchPage';
import { api } from './api/client';
import { DigitalTwinState } from './types';

export const App: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('mx_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedMotorId, setSelectedMotorId] = useState<string>('MOTOR-001');
  const [twins, setTwins] = useState<DigitalTwinState[]>([]);
  const [backendError, setBackendError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mx_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mx_theme', 'light');
    }
  }, [isDark]);

  const fetchTwins = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await api.getAllTwins();
      setBackendError(false);
      setTwins(data || []);
      if (data && data.length > 0) {
        if (!data.some((t) => t.motorId === selectedMotorId)) {
          setSelectedMotorId(data[0].motorId);
        }
      }
    } catch {
      setBackendError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedMotorId]);

  useEffect(() => {
    fetchTwins();
    const interval = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        fetchTwins();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchTwins]);

  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen bg-bg dark:bg-bg-dark text-ink dark:text-ink-inverse flex transition-colors duration-200">
          {/* Left Aerospace Mission Control Navigation Rail */}
          <NavigationRail
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
          />

          {/* Main Viewport Column */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Global Mission Control Header */}
            <GlobalHeader
              onOpenMobile={() => setMobileOpen(true)}
              isDark={isDark}
              onToggleTheme={() => setIsDark(!isDark)}
              selectedMotorId={selectedMotorId}
              onSelectMotor={setSelectedMotorId}
              twins={twins}
              isRefreshing={isRefreshing}
              onRefresh={fetchTwins}
            />

            {/* Page Content Container */}
            <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto pb-12">
              <Routes>
                {/* 1. Overview / Mission Control */}
                <Route
                  path="/"
                  element={
                    <OverviewPage
                      selectedMotorId={selectedMotorId}
                      twins={twins}
                      onRefreshTwins={fetchTwins}
                      connectionError={backendError}
                      onRetryConnection={fetchTwins}
                    />
                  }
                />
                <Route
                  path="/overview"
                  element={
                    <OverviewPage
                      selectedMotorId={selectedMotorId}
                      twins={twins}
                      onRefreshTwins={fetchTwins}
                      connectionError={backendError}
                      onRetryConnection={fetchTwins}
                    />
                  }
                />

                {/* 2. Equipment Monitor */}
                <Route
                  path="/monitor"
                  element={
                    <EquipmentMonitorPage
                      selectedMotorId={selectedMotorId}
                      twins={twins}
                      onSelectMotor={setSelectedMotorId}
                    />
                  }
                />

                {/* 3. AI Diagnostics */}
                <Route
                  path="/diagnostics"
                  element={
                    <DiagnosticsPage
                      selectedMotorId={selectedMotorId}
                      twins={twins}
                      onRefresh={fetchTwins}
                    />
                  }
                />

                {/* 4. Data Lab (with alias /check) */}
                <Route path="/data-lab" element={<DataLabPage />} />
                <Route path="/check" element={<DataLabPage />} />

                {/* 5. Research & Methodology (with alias /about) */}
                <Route path="/research" element={<ResearchPage />} />
                <Route path="/about" element={<ResearchPage />} />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Slim Engineering Mission Control Footer */}
            <footer className="border-t border-rule dark:border-rule-dark py-4 text-center text-xs text-ink-muted font-mono px-4">
              MACHINA-X · An Explainable AI-Driven Digital Twin Framework · IEEE 112 3-Phase Induction Motor · Advisory Decision Support Only
            </footer>
          </div>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
