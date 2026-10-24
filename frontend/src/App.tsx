import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { LeftRail } from './components/LeftRail';
import { TopHeader } from './components/TopHeader';
import { SimulatorModal } from './components/SimulatorModal';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { FleetOverview } from './pages/FleetOverview';
import { MotorDetail } from './pages/MotorDetail';
import { PredictiveMaintenance } from './pages/PredictiveMaintenance';
import { FaultDiagnosis } from './pages/FaultDiagnosis';
import { Explainability } from './pages/Explainability';
import { RemainingUsefulLife } from './pages/RemainingUsefulLife';
import { AlertsMaintenance } from './pages/AlertsMaintenance';
import { CsvAnalysis } from './pages/CsvAnalysis';
import { ResearchResults } from './pages/ResearchResults';
import { ModelStatus } from './pages/ModelStatus';
import { api } from './api/client';
import { DigitalTwinState, AlertRecord, SimulatorStatus } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 3000, // 3-second live digital twin polling
      staleTime: 2000,
      retry: 1
    }
  }
});

function WorkbenchLayout() {
  const [selectedMotorId, setSelectedMotorId] = useState('MOTOR-001');
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);

  // Poll Digital Twin Fleet States
  const { data: twins = [] } = useQuery<DigitalTwinState[]>({
    queryKey: ['twins'],
    queryFn: api.getAllTwins
  });

  // Poll Alerts
  const { data: alerts = [], refetch: refetchAlerts } = useQuery<AlertRecord[]>({
    queryKey: ['alerts'],
    queryFn: () => api.getAlerts()
  });

  // Poll Simulator Status
  const { data: simStatus, refetch: refetchSim } = useQuery<SimulatorStatus>({
    queryKey: ['simulatorStatus'],
    queryFn: api.getSimulatorStatus
  });

  const activeTwin = twins.find((t) => t.motorId === selectedMotorId) || twins[0];

  const handleStartSim = async (motorId: string, scenario: string, severity: number, loadPct: number) => {
    try {
      await api.startSimulator(motorId, scenario, severity, loadPct);
      refetchSim();
      setIsSimModalOpen(false);
    } catch (err) {
      alert('Failed to start simulator: ' + err);
    }
  };

  const handleStopSim = async () => {
    try {
      await api.stopSimulator();
      refetchSim();
      setIsSimModalOpen(false);
    } catch (err) {
      alert('Failed to stop simulator: ' + err);
    }
  };

  const handleToggleSimulator = async () => {
    if (simStatus?.isRunning) {
      await handleStopSim();
    } else {
      setIsSimModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col md:flex-row font-sans">
      <LeftRail
        selectedMotorId={selectedMotorId}
        simulatorStatus={simStatus}
        activeAlertCount={alerts.filter((a) => a.status === 'ACTIVE').length}
        onOpenSimulator={() => setIsSimModalOpen(true)}
        onToggleSimulator={handleToggleSimulator}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10">
          <Routes>
            <Route path="/" element={<Navigate to="/fleet" replace />} />
            <Route
              path="/fleet"
              element={
                <FleetOverview
                  twins={twins}
                  alerts={alerts}
                  onOpenSimulator={() => setIsSimModalOpen(true)}
                />
              }
            />
            <Route
              path="/motor/:motorId"
              element={
                <MotorDetail
                  twin={activeTwin}
                  onOpenSimulator={() => setIsSimModalOpen(true)}
                />
              }
            />
            <Route
              path="/predictions"
              element={<PredictiveMaintenance />}
            />
            <Route
              path="/diagnosis/:motorId"
              element={<FaultDiagnosis twin={activeTwin} />}
            />
            <Route
              path="/explainability/:motorId"
              element={<Explainability twin={activeTwin} />}
            />
            <Route
              path="/rul/:motorId"
              element={
                <RemainingUsefulLife
                  twin={activeTwin}
                  onOpenSimulator={() => setIsSimModalOpen(true)}
                />
              }
            />
            <Route
              path="/alerts"
              element={<AlertsMaintenance alerts={alerts} onRefresh={refetchAlerts} />}
            />
            <Route
              path="/csv-analysis"
              element={<CsvAnalysis />}
            />
            <Route
              path="/research"
              element={<ResearchResults />}
            />
            <Route path="/status" element={<ModelStatus />} />
            <Route path="*" element={<Navigate to="/fleet" replace />} />
          </Routes>
        </main>

        <footer className="border-t border-rule py-3 px-6 text-xs text-mute flex flex-col sm:flex-row items-center justify-between gap-2 bg-panel/30">
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold text-ink">MACHINA-X</span>
            <span>·</span>
            <span>Explainable Cyber-Physical Digital Twin Platform</span>
          </div>
          <div className="font-mono text-[11px] text-mute">
            IEEE Spec 3kW 415V Induction Motor · 10 kHz MCSA Ingestion
          </div>
        </footer>
      </div>

      <SimulatorModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        status={simStatus}
        onStart={handleStartSim}
        onStop={handleStopSim}
        defaultMotorId={selectedMotorId}
      />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/*" element={<WorkbenchLayout />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
