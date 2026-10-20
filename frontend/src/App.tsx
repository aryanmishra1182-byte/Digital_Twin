import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
import { SimulatorModal } from './components/SimulatorModal';
import { FleetOverview } from './pages/FleetOverview';
import { MotorDetail } from './pages/MotorDetail';
import { FaultDiagnosis } from './pages/FaultDiagnosis';
import { Explainability } from './pages/Explainability';
import { RemainingUsefulLife } from './pages/RemainingUsefulLife';
import { AlertsMaintenance } from './pages/AlertsMaintenance';
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

function DashboardContent() {
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
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col">
      <Navbar
        simulatorStatus={simStatus}
        selectedMotorId={selectedMotorId}
        onSelectMotor={setSelectedMotorId}
        onOpenSimulator={() => setIsSimModalOpen(true)}
        onToggleSimulator={handleToggleSimulator}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route
            path="/"
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
          <Route path="/status" element={<ModelStatus />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-[#243247]/60 py-4 bg-[#111827] text-center text-xs text-slate-500">
        Explainable Digital Twin Framework for Three-Phase Induction Motors | IEEE Research Specification
      </footer>

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
        <DashboardContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
