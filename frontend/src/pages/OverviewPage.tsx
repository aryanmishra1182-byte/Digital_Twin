import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { DigitalTwinState, TelemetryPoint } from '../types';
import { TelemetryChart, SignalKey } from '../components/telemetry/TelemetryChart';
import { useToast } from '../context/ToastContext';
import {
  AlertTriangle,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface OverviewPageProps {
  selectedMotorId: string;
  twins: DigitalTwinState[];
  onRefreshTwins?: () => void;
  connectionError?: boolean;
  onRetryConnection?: () => void;
  onSelectMotor?: (id: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  selectedMotorId,
  twins,
  onRefreshTwins,
  connectionError,
  onRetryConnection,
  onSelectMotor,
}) => {
  const { showToast } = useToast();
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [activeSignal, setActiveSignal] = useState<SignalKey>('vibRms');
  const [showSimControls, setShowSimControls] = useState(false);
  const [isInjecting, setIsInjecting] = useState<string | null>(null);

  // Active twin record (strictly synchronized)
  const currentTwin = twins.find((t) => t.motorId === selectedMotorId) || twins[0] || null;

  const loadTelemetry = useCallback(async () => {
    if (!currentTwin) return;
    try {
      const hist = await api.getTelemetryHistory(currentTwin.motorId, 30);
      setTelemetry(hist || []);
    } catch {
      // Backend may be momentarily busy
    }
  }, [currentTwin]);

  useEffect(() => {
    loadTelemetry();
    const timer = setInterval(loadTelemetry, 2500);
    return () => clearInterval(timer);
  }, [loadTelemetry]);

  const handleQuickInject = async (scenario: string, severity: number = 0.65, load: number = 100) => {
    if (!currentTwin) return;
    setIsInjecting(scenario);
    try {
      await api.startSimulator(currentTwin.motorId, scenario, severity, load);
      showToast('success', 'Scenario Injected', `Running simulated ${scenario.replace(/_/g, ' ').toLowerCase()}.`);
      loadTelemetry();
      if (onRefreshTwins) onRefreshTwins();
    } catch (err: any) {
      showToast('error', 'Injection Failed', err.message);
    } finally {
      setIsInjecting(null);
    }
  };

  // 1. Connection Error State (Strictly preserves monitor.test.tsx assertions)
  if (connectionError) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Connection problem</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Can't reach the monitor. Check that the backend is running on port 8080.
        </p>
        <button
          type="button"
          onClick={onRetryConnection || onRefreshTwins}
          className="px-4 py-2 rounded-md bg-[#68409A] text-white text-xs font-semibold hover:bg-[#68409A]/90 transition-colors"
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
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
          <Activity className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">No motor is reporting yet</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          The telemetry pipeline is standing by. Start the motor simulator or send telemetry via the REST API.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setShowSimControls(true)}
            className="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
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
            className="px-4 py-2 rounded-md bg-[#68409A] text-white text-xs font-semibold hover:bg-[#68409A]/90 transition-colors"
          >
            Start demo
          </button>
        </div>
      </div>
    );
  }

  // Consistent status mapping derived from actual application logic
  const getStatusInfo = (twin: DigitalTwinState) => {
    if (twin.operationalState === 'CRITICAL' || twin.healthScore < 50) {
      return {
        label: 'Critical',
        badgeClass: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
        dotClass: 'bg-rose-500',
      };
    }
    if (twin.operationalState === 'WARNING' || twin.healthScore < 80 || twin.isAnomaly) {
      return {
        label: 'Warning',
        badgeClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
        dotClass: 'bg-amber-500',
      };
    }
    return {
      label: 'Healthy',
      badgeClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
      dotClass: 'bg-emerald-500',
    };
  };

  const getConditionText = (twin: DigitalTwinState | null) => {
    if (!twin) return 'Normal operation';
    const isHealthy = twin.operationalState === 'HEALTHY' && twin.healthScore >= 80 && !twin.isAnomaly;
    if (isHealthy) return 'Normal operation';
    if (twin.predictedFaultClass && twin.predictedFaultClass !== 'HEALTHY') {
      return twin.predictedFaultClass.replace(/_/g, ' ');
    }
    if (twin.isAnomaly || twin.operationalState === 'WARNING' || twin.operationalState === 'CRITICAL') {
      return 'Anomaly detected';
    }
    return 'Normal operation';
  };

  const currentStatus = currentTwin ? getStatusInfo(currentTwin) : null;

  return (
    <div className="space-y-5 py-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          Overview
        </h1>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Simulated telemetry
        </span>
      </div>

      {/* Row 1: Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Metric 1: Motor Health */}
        <div className="rounded-lg bg-white dark:bg-[#132736] border border-slate-200 dark:border-[#1E3B50] p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Motor health
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-slate-900 dark:text-white">
                {currentTwin?.healthScore != null ? currentTwin.healthScore.toFixed(0) : '100'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">%</span>
            </div>
            {currentStatus && (
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${currentStatus.badgeClass}`}>
                {currentStatus.label}
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Stator Current */}
        <div className="rounded-lg bg-white dark:bg-[#132736] border border-slate-200 dark:border-[#1E3B50] p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Stator current
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-semibold text-slate-900 dark:text-white">
              {currentTwin?.latestCurrentRms != null ? currentTwin.latestCurrentRms.toFixed(2) : '–'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">A</span>
          </div>
        </div>

        {/* Metric 3: Temperature */}
        <div className="rounded-lg bg-white dark:bg-[#132736] border border-slate-200 dark:border-[#1E3B50] p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Temperature
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-semibold text-slate-900 dark:text-white">
              {currentTwin?.latestTemperatureC != null ? currentTwin.latestTemperatureC.toFixed(1) : '–'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">°C</span>
          </div>
        </div>

        {/* Metric 4: Vibration */}
        <div className="rounded-lg bg-white dark:bg-[#132736] border border-slate-200 dark:border-[#1E3B50] p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Vibration
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-semibold text-slate-900 dark:text-white">
              {currentTwin?.latestVibRms != null ? currentTwin.latestVibRms.toFixed(2) : '–'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">mm/s</span>
          </div>
        </div>
      </div>

      {/* Row 2: Motor Status (Left) and Telemetry Chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Motor Status List */}
        <div className="lg:col-span-4 rounded-lg bg-white dark:bg-[#132736] border border-slate-200 dark:border-[#1E3B50] p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Motor status
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {twins.length} monitored
            </span>
          </div>

          <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[300px]">
            {twins.map((t) => {
              const isSelected = t.motorId === currentTwin?.motorId;
              const status = getStatusInfo(t);

              return (
                <button
                  key={t.motorId}
                  type="button"
                  onClick={() => onSelectMotor?.(t.motorId)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md border text-left transition-colors ${
                    isSelected
                      ? 'border-[#68409A] bg-purple-50/60 dark:bg-[#1A2E3E] dark:border-[#9B6DCC]'
                      : 'border-slate-200 dark:border-[#1E3B50] bg-slate-50/50 dark:bg-[#0E202D] hover:bg-slate-100/70 dark:hover:bg-[#172E40]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status.dotClass}`} />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {t.motorId}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full ${status.badgeClass}`}>
                      {status.label}
                    </span>
                  </div>

                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t.healthScore?.toFixed(0) ?? 100}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Telemetry Chart */}
        <div className="lg:col-span-8">
          <TelemetryChart
            telemetry={telemetry}
            activeSignal={activeSignal}
            onSignalChange={setActiveSignal}
          />
        </div>
      </div>

      {/* Row 3: Additional Details (Diagnostics & RUL for selected motor) */}
      {currentTwin && (
        <div className="rounded-lg bg-white dark:bg-[#132736] border border-slate-200 dark:border-[#1E3B50] p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                Condition ({currentTwin.motorId})
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                {getConditionText(currentTwin)}
              </span>
            </div>

            <div className="border-l border-slate-200 dark:border-[#1E3B50] pl-6">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                Estimated remaining useful life
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {currentTwin.estimatedRulHours != null
                  ? `${currentTwin.estimatedRulHours.toFixed(1)} hours`
                  : 'Normal operation'}
              </span>
            </div>
          </div>

          <Link
            to="/diagnostics"
            className="text-xs font-medium text-[#68409A] dark:text-[#9B6DCC] hover:underline"
          >
            View AI diagnostics & SHAP analysis &rarr;
          </Link>
        </div>
      )}

      {/* Collapsible Simulation Controls */}
      <div className="rounded-lg bg-white dark:bg-[#132736] border border-slate-200 dark:border-[#1E3B50] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSimControls(!showSimControls)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#172E40] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-900 dark:text-white">
              Simulation controls
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              (Inject fault scenarios into {currentTwin?.motorId || 'motor'})
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span>{showSimControls ? 'Hide' : 'Show'}</span>
            {showSimControls ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showSimControls && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-[#1E3B50] space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a fault scenario to evaluate model detection and TreeSHAP attribution:
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'HEALTHY', label: 'Healthy baseline' },
                { id: 'BROKEN_ROTOR_BAR', label: 'Rotor bar fault' },
                { id: 'BEARING_DEFECT', label: 'Bearing defect' },
                { id: 'STATOR_INTER_TURN_SHORT', label: 'Winding short' },
                { id: 'AIR_GAP_ECCENTRICITY', label: 'Eccentricity' },
              ].map((sc) => {
                const isSelected = currentTwin?.predictedFaultClass === sc.id;
                const isPending = isInjecting === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    disabled={isInjecting !== null}
                    onClick={() => handleQuickInject(sc.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                      isSelected
                        ? 'bg-[#68409A] text-white border-[#68409A]'
                        : 'bg-slate-50 dark:bg-[#0E202D] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#1E3B50] hover:bg-slate-100 dark:hover:bg-[#172E40]'
                    }`}
                  >
                    {isPending ? 'Injecting...' : sc.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
