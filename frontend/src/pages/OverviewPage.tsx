import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { DigitalTwinState, TelemetryPoint, AlertRecord } from '../types';
import { MotorSchematic } from '../components/equipment/MotorSchematic';
import { TelemetryChart } from '../components/telemetry/TelemetryChart';
import { SimulatorControlPanel } from '../components/simulator/SimulatorControlPanel';
import { useToast } from '../context/ToastContext';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Radio,
  RefreshCw,
  Sliders,
  Check,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface OverviewPageProps {
  selectedMotorId: string;
  twins: DigitalTwinState[];
  onRefreshTwins?: () => void;
  connectionError?: boolean;
  onRetryConnection?: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  selectedMotorId,
  twins,
  onRefreshTwins,
  connectionError,
  onRetryConnection,
}) => {
  const { showToast } = useToast();
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [loading, setLoading] = useState(false);

  // Active twin record
  const currentTwin = twins.find((t) => t.motorId === selectedMotorId) || twins[0] || null;

  const loadData = useCallback(async () => {
    if (!currentTwin) return;
    try {
      const [hist, al] = await Promise.all([
        api.getTelemetryHistory(currentTwin.motorId, 25),
        api.getAlerts(currentTwin.motorId),
      ]);
      setTelemetry(hist || []);
      setAlerts(al || []);
    } catch {
      // Backend may be momentarily busy
    }
  }, [currentTwin]);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 4000);
    return () => clearInterval(timer);
  }, [loadData]);

  const handleAcknowledgeAlert = async (id: number) => {
    try {
      await api.acknowledgeAlert(id, 'Acknowledged in Mission Control');
      showToast('info', 'Alert Acknowledged', `Alert #${id} marked as acknowledged.`);
      loadData();
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message);
    }
  };

  const handleResolveAlert = async (id: number) => {
    try {
      await api.resolveAlert(id, 'Resolved via Operator Verification');
      showToast('success', 'Alert Resolved', `Alert #${id} successfully resolved.`);
      loadData();
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message);
    }
  };

  // 1. Connection Error State (Strictly preserves monitor.test.tsx assertions)
  if (connectionError) {
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
          onClick={onRetryConnection || onRefreshTwins}
          className="px-4 py-2 rounded-lg bg-aerospace text-white text-xs font-mono font-semibold hover:bg-aerospace-bright transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // 2. Empty State (Strictly preserves monitor.test.tsx assertions)
  if (!connectionError && twins.length === 0) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-surface-secondary text-ink-muted mx-auto flex items-center justify-center">
          <Activity className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-ink dark:text-ink-inverse">No motor is reporting yet</h2>
        <p className="text-sm text-ink-secondary dark:text-ink-muted leading-relaxed">
          The telemetry pipeline is standing by. Start the motor simulator or send telemetry via the REST API.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setShowSimulator(true)}
            className="px-4 py-2 rounded-lg bg-surface-secondary dark:bg-panel-dark-subtle text-ink dark:text-ink-inverse text-xs font-mono font-semibold hover:bg-rule dark:hover:bg-rule-dark transition-colors border border-rule dark:border-rule-dark"
          >
            Go to demo setup
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await api.startSimulator('MOTOR-001', 'HEALTHY', 0.5, 100);
                if (onRefreshTwins) onRefreshTwins();
                showToast('success', 'Demo Started', 'Simulator started broadcasting telemetry.');
              } catch (err: any) {
                showToast('error', 'Demo Error', err.message);
              }
            }}
            className="px-4 py-2 rounded-lg bg-aerospace text-white text-xs font-mono font-semibold hover:bg-aerospace-bright transition-colors"
          >
            Start demo
          </button>
        </div>
      </div>
    );
  }

  const opState = currentTwin?.operationalState || 'HEALTHY';
  const isAnomaly = currentTwin?.isAnomaly ?? false;
  const faultClass = currentTwin?.predictedFaultClass || 'HEALTHY';
  const anomalyScore = currentTwin?.anomalyScore ?? 0.0;
  const confidence = currentTwin?.confidence ?? 1.0;
  const rulHours = currentTwin?.estimatedRulHours ?? null;

  return (
    <div className="space-y-6 py-6">
      {/* Top Mission Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-aerospace dark:text-aerospace-bright">
              AEROSPACE MISSION CONTROL
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark text-ink-muted">
              STREAM: SIMULATED (10 kHz)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink dark:text-ink-inverse mt-1">
            Equipment Intelligence & Condition Monitoring
          </h2>
          <p className="text-xs text-ink-secondary dark:text-ink-muted font-mono mt-0.5">
            Active Target: {currentTwin?.motorId} · {currentTwin?.motorName}
          </p>
        </div>

        {/* Quick Simulator Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSimulator(!showSimulator)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all ${
              showSimulator
                ? 'bg-aerospace text-white border-aerospace'
                : 'bg-panel dark:bg-panel-dark text-ink-secondary hover:text-ink dark:hover:text-ink-inverse border-rule dark:border-rule-dark hover:bg-surface-secondary dark:hover:bg-panel-dark-subtle'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showSimulator ? 'Hide Controls' : 'Physics Simulator'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Simulator Control Panel */}
      {showSimulator && (
        <div className="transition-all animate-in fade-in slide-in-from-top-2">
          <SimulatorControlPanel
            selectedMotorId={currentTwin?.motorId || 'MOTOR-001'}
            onSimulatorUpdated={loadData}
          />
        </div>
      )}

      {/* Primary Operational Strip (KPI Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Operational State */}
        <div className="p-3.5 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
            System State
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2 h-2 rounded-full ${
                opState === 'CRITICAL'
                  ? 'bg-state-critical animate-ping'
                  : opState === 'WARNING'
                  ? 'bg-state-warning'
                  : 'bg-state-normal'
              }`}
            />
            <span
              className={`font-mono text-sm sm:text-base font-bold ${
                opState === 'CRITICAL'
                  ? 'text-state-critical'
                  : opState === 'WARNING'
                  ? 'text-state-warning'
                  : 'text-state-normal'
              }`}
            >
              {opState}
            </span>
          </div>
          <span className="text-[10px] text-ink-muted font-mono mt-0.5 block">
            Health: {currentTwin?.healthScore?.toFixed(0) ?? 100}%
          </span>
        </div>

        {/* Stage 1 Anomaly Status */}
        <div className="p-3.5 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
            Stage 1 Screener
          </span>
          <div className="font-mono text-sm sm:text-base font-bold text-ink dark:text-ink-inverse mt-1 truncate">
            {isAnomaly ? (
              <span className="text-state-critical">FLAGGED</span>
            ) : (
              <span className="text-state-normal">NOMINAL</span>
            )}
          </div>
          <span className="text-[10px] text-ink-muted font-mono mt-0.5 block truncate">
            Score: {anomalyScore.toFixed(3)} (τ=0.002)
          </span>
        </div>

        {/* Stage 2 Classifier Prediction */}
        <div className="p-3.5 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
            Stage 2 Diagnosis
          </span>
          <div className="font-mono text-xs sm:text-sm font-bold text-ink dark:text-ink-inverse mt-1 truncate">
            {faultClass.replace(/_/g, ' ')}
          </div>
          <span className="text-[10px] text-ink-muted font-mono mt-0.5 block">
            Confidence: {(confidence * 100).toFixed(1)}%
          </span>
        </div>

        {/* Stage 3 RUL */}
        <div className="p-3.5 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
            Estimated RUL
          </span>
          <div className="font-mono text-sm sm:text-base font-bold text-ink dark:text-ink-inverse mt-1">
            {rulHours != null ? (
              <span>
                {rulHours.toFixed(1)} <span className="text-xs text-ink-muted font-normal">hrs</span>
              </span>
            ) : (
              <span className="text-state-normal text-xs">&gt; 48 hrs</span>
            )}
          </div>
          <span className="text-[10px] text-ink-muted font-mono mt-0.5 block">
            LSTM Model v1.0
          </span>
        </div>

        {/* Active Alerts */}
        <div className="p-3.5 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
            Active Alerts
          </span>
          <div className="font-mono text-sm sm:text-base font-bold text-ink dark:text-ink-inverse mt-1 flex items-center gap-1.5">
            <ShieldAlert
              className={`w-4 h-4 ${
                alerts.length > 0 ? 'text-state-critical' : 'text-state-normal'
              }`}
            />
            <span>{alerts.length}</span>
          </div>
          <span className="text-[10px] text-ink-muted font-mono mt-0.5 block">
            ISO / EPRI Guidelines
          </span>
        </div>

        {/* Telemetry Buffer Freshness */}
        <div className="p-3.5 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
            Stream Cadence
          </span>
          <div className="font-mono text-sm sm:text-base font-bold text-telemetry-cyan mt-1 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>10,000 Hz</span>
          </div>
          <span className="text-[10px] text-ink-muted font-mono mt-0.5 block">
            Decimated to 1 Hz
          </span>
        </div>
      </div>

      {/* Main Digital Twin Schematic Visualization */}
      <MotorSchematic
        twin={currentTwin}
        selectedSensorId={selectedSensorId}
        onSelectSensor={(id) => setSelectedSensorId(id)}
      />

      {/* Split Row: Multi-Signal Telemetry Chart + Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Telemetry Chart */}
        <div className="lg:col-span-2">
          <TelemetryChart telemetry={telemetry} loading={loading} />
        </div>

        {/* Right Col: Recent Operational Alerts Feed */}
        <div className="rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-aerospace" />
                <h3 className="text-sm font-semibold text-ink dark:text-ink-inverse">
                  Recent Alerts & Actions
                </h3>
              </div>
              <span className="text-[10px] font-mono text-ink-muted">
                {alerts.length} Records
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="p-6 text-center text-ink-muted">
                <CheckCircle2 className="w-6 h-6 text-state-normal mx-auto mb-1.5 opacity-80" />
                <p className="font-mono text-xs text-ink dark:text-ink-inverse">No Unresolved Alerts</p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  All telemetry is operating within healthy ISO 10816 limits.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            alert.severity === 'P1_CRITICAL'
                              ? 'bg-state-critical'
                              : 'bg-state-warning'
                          }`}
                        />
                        <span className="font-bold text-ink dark:text-ink-inverse truncate">
                          {alert.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-ink-muted whitespace-nowrap">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-ink-secondary dark:text-ink-muted leading-relaxed">
                      {alert.description}
                    </p>

                    {alert.suggestedAction && (
                      <p className="text-[10px] text-aerospace dark:text-aerospace-bright font-mono">
                        Action: {alert.suggestedAction}
                      </p>
                    )}

                    {/* Alert action buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-rule/50 dark:border-rule-dark/50">
                      {alert.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          className="px-2 py-0.5 rounded bg-surface-secondary dark:bg-panel-dark text-[10px] font-mono text-ink hover:text-aerospace border border-rule dark:border-rule-dark transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleResolveAlert(alert.id)}
                        className="px-2 py-0.5 rounded bg-state-normal text-white text-[10px] font-mono font-medium hover:bg-state-normal/90 transition-colors"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-rule dark:border-rule-dark text-[10px] font-mono text-ink-muted">
            Safety Disclaimer: Advisory guidance only. Observe plant electrical safety procedures.
          </div>
        </div>
      </div>
    </div>
  );
};
