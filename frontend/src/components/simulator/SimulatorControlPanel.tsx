import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { SimulatorStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Play, Square, Sliders, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface SimulatorControlPanelProps {
  selectedMotorId: string;
  onSimulatorUpdated?: () => void;
}

export const SimulatorControlPanel: React.FC<SimulatorControlPanelProps> = ({
  selectedMotorId,
  onSimulatorUpdated,
}) => {
  const { showToast } = useToast();
  const [status, setStatus] = useState<SimulatorStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [scenario, setScenario] = useState<string>('BROKEN_ROTOR_BAR');
  const [severity, setSeverity] = useState<number>(0.5);
  const [loadPct, setLoadPct] = useState<number>(100);

  const fetchStatus = async () => {
    try {
      const s = await api.getSimulatorStatus();
      setStatus(s);
      if (s) {
        if (s.scenario) setScenario(s.scenario);
        if (s.severity != null) setSeverity(s.severity);
        if (s.loadPct != null) setLoadPct(s.loadPct);
      }
    } catch {
      // Backend may be offline or simulator not ready
    }
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await api.startSimulator(selectedMotorId, scenario, severity, loadPct);
      setStatus(res);
      showToast('success', 'Simulator Started', `Injecting ${scenario} scenario at ${loadPct}% load.`);
      if (onSimulatorUpdated) onSimulatorUpdated();
    } catch (err: any) {
      showToast('error', 'Simulator Error', err.message || 'Failed to start simulator.');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      const res = await api.stopSimulator();
      setStatus(res);
      showToast('info', 'Simulator Stopped', 'Motor telemetry generation halted.');
      if (onSimulatorUpdated) onSimulatorUpdated();
    } catch (err: any) {
      showToast('error', 'Simulator Error', err.message || 'Failed to stop simulator.');
    } finally {
      setLoading(false);
    }
  };

  const isRunning = status?.isRunning ?? false;

  return (
    <div className="rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark p-4 sm:p-5">
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-aerospace" />
          <h3 className="text-sm font-semibold text-ink dark:text-ink-inverse">
            Induction Motor Physics Simulator
          </h3>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isRunning ? 'bg-state-normal animate-pulse' : 'bg-ink-muted'
            }`}
          />
          <span className={isRunning ? 'text-state-normal font-semibold' : 'text-ink-muted'}>
            {isRunning ? 'TRANSMITTING' : 'IDLE'}
          </span>
        </div>
      </div>

      <p className="text-xs text-ink-secondary dark:text-ink-muted mb-4">
        Inject electrical and mechanical operating conditions to validate multi-sensor AI response in real time.
      </p>

      {/* Simulator Parameters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Scenario Select */}
        <div>
          <label className="block text-[11px] font-mono text-ink-muted uppercase mb-1">
            Fault Scenario
          </label>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            disabled={loading}
            className="w-full bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark rounded-lg px-2.5 py-1.5 text-xs font-mono text-ink dark:text-ink-inverse focus:outline-none focus:border-aerospace"
          >
            <option value="HEALTHY">HEALTHY (Baseline)</option>
            <option value="BROKEN_ROTOR_BAR">BROKEN ROTOR BAR (MCSA)</option>
            <option value="STATOR_INTER_TURN_SHORT">STATOR WINDING SHORT</option>
            <option value="BEARING_DEFECT">BEARING INNER/OUTER RACE</option>
            <option value="AIR_GAP_ECCENTRICITY">AIR-GAP ECCENTRICITY</option>
          </select>
        </div>

        {/* Severity Slider */}
        <div>
          <div className="flex justify-between items-center text-[11px] font-mono text-ink-muted uppercase mb-1">
            <span>Severity</span>
            <span className="font-bold text-ink dark:text-ink-inverse">{(severity * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1.0"
            step="0.05"
            value={severity}
            onChange={(e) => setSeverity(parseFloat(e.target.value))}
            disabled={loading || scenario === 'HEALTHY'}
            className="w-full accent-aerospace cursor-pointer"
          />
        </div>

        {/* Load Slider */}
        <div>
          <div className="flex justify-between items-center text-[11px] font-mono text-ink-muted uppercase mb-1">
            <span>Mechanical Load</span>
            <span className="font-bold text-ink dark:text-ink-inverse">{loadPct}%</span>
          </div>
          <input
            type="range"
            min="25"
            max="125"
            step="5"
            value={loadPct}
            onChange={(e) => setLoadPct(parseInt(e.target.value, 10))}
            disabled={loading}
            className="w-full accent-aerospace cursor-pointer"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-rule dark:border-rule-dark">
        <div className="text-[11px] font-mono text-ink-muted">
          Ticks Emitted: <span className="font-bold text-ink dark:text-ink-inverse">{status?.ticksEmitted ?? 0}</span> · Core Temp: <span className="font-bold text-ink dark:text-ink-inverse">{status?.currentTempC ? `${status.currentTempC.toFixed(1)}°C` : '–'}</span>
        </div>

        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              type="button"
              onClick={handleStop}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-state-critical text-white text-xs font-mono font-semibold flex items-center gap-1.5 hover:bg-state-critical/90 transition-colors shadow-sm"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Halt Generator</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-aerospace text-white text-xs font-mono font-semibold flex items-center gap-1.5 hover:bg-aerospace-bright transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Inject Telemetry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
