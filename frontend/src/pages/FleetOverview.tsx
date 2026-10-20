import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
  Zap,
  Gauge,
  Thermometer,
  Waves
} from 'lucide-react';
import { DigitalTwinState, AlertRecord } from '../types';

interface FleetOverviewProps {
  twins: DigitalTwinState[];
  alerts: AlertRecord[];
  onOpenSimulator: () => void;
}

export const FleetOverview: React.FC<FleetOverviewProps> = ({ twins, alerts, onOpenSimulator }) => {
  const navigate = useNavigate();

  const totalMotors = twins.length;
  const healthyCount = twins.filter((t) => t.operationalState === 'HEALTHY').length;
  const warningCount = twins.filter((t) => t.operationalState === 'WARNING').length;
  const criticalCount = twins.filter((t) => t.operationalState === 'CRITICAL').length;
  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'HEALTHY':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">HEALTHY</span>;
      case 'WARNING':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">WARNING</span>;
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">CRITICAL</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-500/20 text-slate-300">OFFLINE</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Fleet Asset Overview</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time digital twin synchronization across monitored induction motors
          </p>
        </div>
        <button
          onClick={onOpenSimulator}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-colors w-fit"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Launch Telemetry Simulator</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Assets</span>
            <Gauge className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">{totalMotors}</div>
          <div className="text-[11px] text-slate-500 mt-1">3kW 415V Induction Motors</div>
        </div>

        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Healthy</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{healthyCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Normal operating baseline</div>
        </div>

        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Warning</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{warningCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Subtle anomaly detected</div>
        </div>

        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Critical</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">{criticalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Immediate inspection required</div>
        </div>

        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Active Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-300">{activeAlerts.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">P1 & P2 notifications</div>
        </div>
      </div>

      {/* Motor Asset Cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider text-xs">
          Monitored Digital Twin Replicas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {twins.map((twin) => (
            <div
              key={twin.motorId}
              className="bg-[#151d2e] border border-[#243247] hover:border-slate-600 rounded-xl p-5 transition-all shadow-lg flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-bold text-sky-400">{twin.motorId}</span>
                      {getStateBadge(twin.operationalState)}
                    </div>
                    <div className="text-xs text-slate-300 font-medium mt-1">
                      {twin.motorName || twin.motorId}
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${getHealthColor(twin.healthScore)}`}>
                    Health: {twin.healthScore}%
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#243247]/60">
                  <div className="bg-[#111827] rounded-lg p-2.5 border border-[#243247]/40">
                    <div className="flex items-center text-[10px] text-slate-400 mb-1">
                      <Zap className="w-3 h-3 mr-1 text-sky-400" /> Current
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-200">
                      {twin.latestCurrentRms.toFixed(2)} A
                    </div>
                    <div className="text-[10px] text-slate-500">Rated: 5.8 A</div>
                  </div>

                  <div className="bg-[#111827] rounded-lg p-2.5 border border-[#243247]/40">
                    <div className="flex items-center text-[10px] text-slate-400 mb-1">
                      <Waves className="w-3 h-3 mr-1 text-amber-400" /> Vibration
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-200">
                      {twin.latestVibRms.toFixed(2)} m/s²
                    </div>
                    <div className="text-[10px] text-slate-500">Kurtosis: {twin.latestVibKurtosis.toFixed(2)}</div>
                  </div>

                  <div className="bg-[#111827] rounded-lg p-2.5 border border-[#243247]/40">
                    <div className="flex items-center text-[10px] text-slate-400 mb-1">
                      <Thermometer className="w-3 h-3 mr-1 text-rose-400" /> Temp
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-200">
                      {twin.latestTemperatureC.toFixed(1)} °C
                    </div>
                    <div className="text-[10px] text-slate-500">Load: {twin.latestLoadPct}%</div>
                  </div>
                </div>

                {/* Diagnosis Summary */}
                <div className="mt-3 bg-[#111827] rounded-lg p-3 border border-[#243247]/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] mr-2">Condition:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {twin.predictedFaultClass}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-2">
                      ({Math.round(twin.confidence * 100)}% conf)
                    </span>
                  </div>
                  {twin.estimatedRulHours != null && (
                    <div className="text-sky-400 font-mono text-[11px] font-semibold">
                      RUL: {twin.estimatedRulHours.toFixed(1)} hrs
                    </div>
                  )}
                </div>
              </div>

              {/* Action Link */}
              <div className="mt-4 pt-3 border-t border-[#243247]/60 flex justify-end">
                <button
                  onClick={() => navigate(`/motor/${twin.motorId}`)}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                >
                  <span>Open Digital Twin Diagnostic View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Alerts Table Preview */}
      <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200">Recent Prioritized Alerts</h2>
          </div>
          <button
            onClick={() => navigate('/alerts')}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium"
          >
            View All Alerts ({alerts.length})
          </button>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No active alerts. All monitored motors operating within nominal limits.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 border-b border-[#243247] bg-[#111827]">
                <tr>
                  <th className="py-2 px-3">Priority</th>
                  <th className="py-2 px-3">Motor</th>
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3">Suggested Inspection</th>
                  <th className="py-2 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243247]/50">
                {activeAlerts.slice(0, 4).map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alert.severity === 'P1_CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-sky-400">{alert.motorId}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-200">{alert.title}</td>
                    <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">{alert.suggestedAction}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
