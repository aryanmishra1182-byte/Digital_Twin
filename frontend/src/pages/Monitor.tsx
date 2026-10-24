import React, { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { DigitalTwinState, AlertRecord, SimulatorStatus } from '../types';
import { EquipmentMonitorPage } from './EquipmentMonitorPage';
import { OverviewPage } from './OverviewPage';
import { AlertTriangle, Activity } from 'lucide-react';

export const Monitor: React.FC = () => {
  const [twins, setTwins] = useState<DigitalTwinState[]>([]);
  const [selectedMotorId, setSelectedMotorId] = useState<string>('MOTOR-001');
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [simStatus, setSimStatus] = useState<SimulatorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [allTwins, allAlerts, sim] = await Promise.all([
        api.getAllTwins(),
        api.getAlerts().catch(() => []),
        api.getSimulatorStatus().catch(() => null),
      ]);

      setBackendError(false);
      setTwins(allTwins || []);
      setAlerts(allAlerts || []);
      setSimStatus(sim);

      if (allTwins && allTwins.length > 0) {
        if (!allTwins.some((t) => t.motorId === selectedMotorId)) {
          setSelectedMotorId(allTwins[0].motorId);
        }
      }
    } catch {
      setBackendError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedMotorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (backendError) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-state-critical-pale text-state-critical mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-ink dark:text-ink-inverse">Connection problem</h2>
        <p className="text-sm text-ink-secondary dark:text-ink-muted leading-relaxed">
          Can't reach the monitor. Check that the backend is running on port 8080.
        </p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            fetchData();
          }}
          className="px-6 py-2.5 rounded-lg bg-aerospace text-white text-xs font-mono font-semibold hover:bg-aerospace-bright transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-surface-secondary dark:bg-panel-dark-subtle rounded w-1/3"></div>
        <div className="h-48 bg-surface-secondary dark:bg-panel-dark-subtle rounded"></div>
      </div>
    );
  }

  if (twins.length === 0) {
    return (
      <div className="py-12 space-y-8">
        <div className="text-center space-y-3 py-6 border-b border-rule dark:border-rule-dark">
          <h2 className="text-2xl font-bold text-ink dark:text-ink-inverse">No motor is reporting yet</h2>
          <p className="text-sm text-ink-secondary dark:text-ink-muted max-w-md mx-auto">
            Live telemetry has not arrived. You can start a simulated test run below to see how the monitor works.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => demoRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="px-5 py-2.5 rounded-lg bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark text-xs font-mono font-semibold text-ink dark:text-ink-inverse hover:bg-rule dark:hover:bg-rule-dark"
            >
              Go to demo setup
            </button>
            <button
              type="button"
              onClick={async () => {
                await api.startSimulator('MOTOR-001', 'HEALTHY', 0.5, 75).catch(() => {});
                fetchData();
              }}
              className="px-5 py-2.5 rounded-lg bg-aerospace text-white text-xs font-mono font-semibold hover:bg-aerospace-bright"
            >
              Start demo
            </button>
          </div>
        </div>
        <div ref={demoRef} id="demo-section"></div>
      </div>
    );
  }

  return (
    <EquipmentMonitorPage
      selectedMotorId={selectedMotorId}
      twins={twins}
      onSelectMotor={setSelectedMotorId}
    />
  );
};
