import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Gauge,
  Thermometer,
  Waves,
  Zap,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { DigitalTwinState, AlertRecord } from '../types';
import { StateBadge, SeverityBadge } from '../components/ui/Badge';
import { SectionHeader } from '../components/ui/SectionHeader';

import { ModelProvenanceTable } from '../components/ModelProvenanceTable';

interface FleetOverviewProps {
  twins: DigitalTwinState[];
  alerts: AlertRecord[];
  onOpenSimulator: () => void;
}

export const FleetOverview: React.FC<FleetOverviewProps> = ({ twins, alerts, onOpenSimulator }) => {
  const navigate = useNavigate();

  const totalMotors = twins.length || 2;
  const healthyCount = twins.filter((t) => t.operationalState === 'HEALTHY').length;
  const warningCount = twins.filter((t) => t.operationalState === 'WARNING').length;
  const criticalCount = twins.filter((t) => t.operationalState === 'CRITICAL').length;
  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');

  // Compute fleet health average
  const avgHealth = twins.length > 0
    ? (twins.reduce((acc, t) => acc + (t.healthScore || 0), 0) / twins.length).toFixed(1)
    : '85.0';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <SectionHeader
        title="Fleet Telemetry & Digital Twin Monitor"
        subtitle="Continuous 10 kHz signal processing, multi-stage machine learning inference, and digital twin state synchronization for industrial 3-phase induction motors."
        tag="IEEE Spec: 3kW · 415V"
        actions={
          <button
            onClick={onOpenSimulator}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium shadow-subtle transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Open Signal Generator</span>
          </button>
        }
      />

      {/* Fleet Health Distribution Bar & KPI Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Fleet Health Composite */}
        <div className="bg-panel border border-panel-border rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="uppercase font-medium text-[11px] tracking-wider">Fleet Health Index</span>
              <Gauge className="w-4 h-4 text-brand-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-slate-100">{avgHealth}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden flex">
              <div style={{ width: `${(healthyCount / totalMotors) * 100}%` }} className="bg-emerald-500" />
              <div style={{ width: `${(warningCount / totalMotors) * 100}%` }} className="bg-amber-500" />
              <div style={{ width: `${(criticalCount / totalMotors) * 100}%` }} className="bg-rose-500" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
              <span className="text-emerald-400">{healthyCount} Healthy</span>
              <span className="text-amber-400">{warningCount} Warning</span>
              <span className="text-rose-400">{criticalCount} Critical</span>
            </div>
          </div>
        </div>

        {/* Operational Availability */}
        <div className="bg-panel border border-panel-border rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-medium text-[11px] tracking-wider">Monitored Assets</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-mono font-bold text-slate-100">{totalMotors}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Active Twin Replicas Online
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-panel-border/60 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Sampling: 10 kHz MCSA</span>
            <span className="font-mono text-brand-400">1-sec windows</span>
          </div>
        </div>

        {/* Anomaly / Fault Watch */}
        <div className="bg-panel border border-panel-border rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-medium text-[11px] tracking-wider">Anomaly State</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-mono font-bold text-amber-400">
              {warningCount + criticalCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Assets with active anomaly trigger
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-panel-border/60 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Stage 1 Isolation Forest</span>
            <span className="font-mono text-slate-300">Contam: 0.05</span>
          </div>
        </div>

        {/* Actionable Alerts */}
        <div className="bg-panel border border-panel-border rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-medium text-[11px] tracking-wider">Active Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-mono font-bold text-rose-400">
              {activeAlerts.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Pending maintenance inspections
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-panel-border/60 flex items-center justify-between text-[11px]">
            <button
              onClick={() => navigate('/alerts')}
              className="text-brand-400 hover:text-brand-300 inline-flex items-center gap-1 font-medium"
            >
              <span>Inspect Alert Queue</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Monitored Assets Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Synchronized Digital Twin Replicas
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Poll rate: 3000ms
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {twins.map((twin) => {
            const isAnomaly = twin.isAnomaly || twin.operationalState !== 'HEALTHY';
            const healthColor =
              twin.healthScore >= 80 ? 'text-emerald-400' :
              twin.healthScore >= 50 ? 'text-amber-400' : 'text-rose-400';

            return (
              <div
                key={twin.motorId}
                className="bg-panel border border-panel-border rounded-lg p-5 transition-all hover:border-panel-border-strong flex flex-col justify-between"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-slate-100">
                          {twin.motorId}
                        </span>
                        <StateBadge state={twin.operationalState} />
                      </div>
                      <div className="text-xs text-slate-300 font-medium mt-0.5">
                        {twin.motorName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {twin.configuration?.location || 'Plant Floor - Line A'} · 3.0 kW · 415 V · 4-Pole
                      </div>
                    </div>

                    {/* Health Gauge Box */}
                    <div className="text-right flex-shrink-0 bg-surface/60 border border-panel-border rounded-lg px-3 py-1.5">
                      <div className="text-[10px] uppercase font-mono text-slate-400">Health</div>
                      <div className={`text-xl font-mono font-bold ${healthColor}`}>
                        {twin.healthScore.toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Physical Telemetry Quad */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-panel-border/60">
                    <div className="bg-surface/30 rounded p-2 border border-panel-border/40">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium uppercase">
                        <Zap className="w-3 h-3 text-sky-400" /> Stator Current
                      </div>
                      <div className="mt-1 font-mono text-sm font-semibold text-slate-200">
                        {twin.latestCurrentRms.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">A RMS</span>
                      </div>
                    </div>

                    <div className="bg-surface/30 rounded p-2 border border-panel-border/40">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium uppercase">
                        <Waves className="w-3 h-3 text-violet-400" /> Vibration
                      </div>
                      <div className="mt-1 font-mono text-sm font-semibold text-slate-200">
                        {twin.latestVibRms.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">mm/s</span>
                      </div>
                    </div>

                    <div className="bg-surface/30 rounded p-2 border border-panel-border/40">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium uppercase">
                        <Thermometer className="w-3 h-3 text-amber-400" /> Casing Temp
                      </div>
                      <div className="mt-1 font-mono text-sm font-semibold text-slate-200">
                        {twin.latestTemperatureC.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">°C</span>
                      </div>
                    </div>

                    <div className="bg-surface/30 rounded p-2 border border-panel-border/40">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium uppercase">
                        <Gauge className="w-3 h-3 text-emerald-400" /> Shaft Speed
                      </div>
                      <div className="mt-1 font-mono text-sm font-semibold text-slate-200">
                        {twin.latestEstimatedSpeedRpm.toFixed(0)} <span className="text-[10px] text-slate-400 font-normal">RPM</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Inference Diagnostic Strip */}
                  <div className={`mt-3 p-3 rounded-lg border text-xs ${
                    isAnomaly
                      ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                      : 'bg-surface/40 border-panel-border text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase font-mono text-slate-400">Predicted Class:</span>
                        <span className="font-semibold text-slate-100">
                          {twin.predictedFaultClass?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        Conf: <span className="text-slate-200 font-semibold">{(twin.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    {twin.estimatedRulHours !== null && twin.estimatedRulHours !== undefined && (
                      <div className="mt-1.5 flex items-center justify-between pt-1.5 border-t border-panel-border/40 text-[11px]">
                        <span className="text-slate-400">Stage 3 RUL Estimate:</span>
                        <span className="font-mono font-semibold text-emerald-400">
                          {twin.estimatedRulHours.toFixed(1)} Hours
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Navigation Actions */}
                <div className="mt-4 pt-3 border-t border-panel-border/60 flex items-center justify-between gap-2 text-xs">
                  <div className="text-[10px] text-slate-400 font-mono">
                    Updated {new Date(twin.lastUpdated).toLocaleTimeString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/explainability/${twin.motorId}`)}
                      className="px-2.5 py-1 rounded text-slate-300 hover:text-brand-300 hover:bg-surface transition-colors font-medium text-xs"
                    >
                      SHAP Details
                    </button>
                    <button
                      onClick={() => navigate(`/motor/${twin.motorId}`)}
                      className="px-3 py-1 rounded bg-surface hover:bg-surface-elevated text-slate-100 border border-panel-border font-medium text-xs inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Open Twin</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Alerts Quick Stream */}
      {alerts.length > 0 && (
        <div className="bg-panel border border-panel-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Recent Fleet Advisory Dispatches
              </h3>
            </div>
            <button
              onClick={() => navigate('/alerts')}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium inline-flex items-center gap-1"
            >
              <span>View All ({alerts.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-panel-border/60">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <SeverityBadge severity={alert.severity} />
                  <div>
                    <span className="font-mono text-slate-400 mr-2">{alert.motorId}</span>
                    <span className="text-slate-200 font-medium">{alert.title}</span>
                  </div>
                </div>
                <div className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Machine Learning Pipeline Architecture */}
      <ModelProvenanceTable />
    </div>
  );
};
