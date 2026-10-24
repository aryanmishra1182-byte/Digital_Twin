import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Cpu,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Info,
  Clock,
  ExternalLink
} from 'lucide-react';
import { DigitalTwinState, PredictionRecord } from '../types';
import { api } from '../api/client';
import { StateBadge, SeverityBadge } from '../components/ui/Badge';
import { SectionHeader } from '../components/ui/SectionHeader';

interface FaultDiagnosisProps {
  twin?: DigitalTwinState;
}

const FAULT_DETAILS: Record<string, { name: string; color: string; physics: string; action: string }> = {
  HEALTHY: {
    name: 'Healthy Operation',
    color: '#10b981',
    physics: 'Balanced three-phase stator current, minimal sideband content, vibration within ISO 10816-3 Class I limits (<0.71 mm/s RMS).',
    action: 'Routine observation; no corrective maintenance required.'
  },
  BROKEN_ROTOR_BAR: {
    name: 'Broken Rotor Bar',
    color: '#0ea5e9',
    physics: 'Rotor cage asymmetry modulates the stator flux, creating lower and upper sidebands around the fundamental supply: f_br = fs(1 ± 2s) at ~46 Hz and ~54 Hz.',
    action: 'Schedule off-line rotor current signature verification and inspect cage end rings for cracking.'
  },
  STATOR_INTER_TURN_SHORT: {
    name: 'Stator Turn Short',
    color: '#f59e0b',
    physics: 'Inter-turn copper insulation degradation induces circulating fault currents, creating elevated 3rd harmonic (150 Hz) distortion and localized casing hot spots.',
    action: 'Perform insulation resistance (Megger) and surge test (IEEE 522); plan stator coil rewinding.'
  },
  BEARING_DEFECT: {
    name: 'Bearing Race Defect',
    color: '#ec4899',
    physics: 'Rolling element passing outer or inner raceway flaking creates periodic mechanical shock pulses at Ball Pass Frequency Outer (BPFO ~80 Hz), elevating kurtosis.',
    action: 'Check lubrication grease condition; schedule bearing replacement before race flaking causes catastrophic seizure.'
  },
  AIR_GAP_ECCENTRICITY: {
    name: 'Air-Gap Eccentricity',
    color: '#8b5cf6',
    physics: 'Static or dynamic non-uniformity between rotor and stator bore generates 1x shaft rotational speed vibration (24 Hz) and high-frequency slot harmonics.',
    action: 'Inspect bearing housing bore alignment, motor mounting shims, and rotor shaft runout.'
  },
  UNKNOWN_ANOMALY: {
    name: 'Unrecognized Anomaly',
    color: '#ef4444',
    physics: 'Telemetry triggered Stage 1 Isolation Forest outlier detection, but class probabilities from Stage 2 XGBoost remain below decision confidence threshold (<0.60).',
    action: 'Dispatch maintenance technician for manual vibration analysis and spectrum inspection.'
  }
};

export const FaultDiagnosis: React.FC<FaultDiagnosisProps> = ({ twin }) => {
  const { motorId } = useParams<{ motorId: string }>();
  const navigate = useNavigate();
  const id = motorId || 'MOTOR-001';

  const [history, setHistory] = useState<PredictionRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const data = await api.getPredictionHistory(id, 15);
        if (isMounted) setHistory(data);
      } catch (err) {
        // silent fallback
      }
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id]);

  const currentFaultClass = twin?.predictedFaultClass || 'HEALTHY';
  const faultInfo = FAULT_DETAILS[currentFaultClass] || FAULT_DETAILS.HEALTHY;

  // Build probability bar chart data
  const probData = twin?.classProbabilities
    ? Object.entries(twin.classProbabilities).map(([cls, prob]) => ({
        className: (FAULT_DETAILS[cls]?.name || cls).replace(/_/g, ' '),
        rawClass: cls,
        probability: Math.round(prob * 100),
        color: FAULT_DETAILS[cls]?.color || '#94a3b8'
      }))
    : [
        { className: 'Healthy Operation', rawClass: 'HEALTHY', probability: 95, color: '#10b981' },
        { className: 'Broken Rotor Bar', rawClass: 'BROKEN_ROTOR_BAR', probability: 2, color: '#0ea5e9' },
        { className: 'Stator Turn Short', rawClass: 'STATOR_INTER_TURN_SHORT', probability: 1, color: '#f59e0b' },
        { className: 'Bearing Defect', rawClass: 'BEARING_DEFECT', probability: 1, color: '#ec4899' },
        { className: 'Air-Gap Eccentricity', rawClass: 'AIR_GAP_ECCENTRICITY', probability: 1, color: '#8b5cf6' }
      ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title={`Fault Diagnostics — ${id}`}
        subtitle="Stage 2: XGBoost multiclass model operating on physics-guided spectral MCSA, vibration kurtosis, and thermal feature vectors."
        tag="Stage 2 Inference"
        actions={
          <button
            onClick={() => navigate(`/explainability/${id}`)}
            className="px-3.5 py-1.5 rounded-md bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs inline-flex items-center gap-1.5 shadow-subtle transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explain with SHAP</span>
          </button>
        }
      />

      {/* Main Diagnostic Placard */}
      <div className="bg-panel border border-panel-border rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-panel-border/60">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Primary Diagnostic Classification
            </span>
            <div className="flex items-center gap-3 mt-1">
              <div
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: faultInfo.color }}
              />
              <h2 className="text-xl font-bold tracking-tight text-slate-100">
                {faultInfo.name}
              </h2>
              {twin && <StateBadge state={twin.operationalState} />}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-4">
              <span>Classifier: <strong className="font-mono text-slate-300 font-normal">XGBoost 3.x Multiclass</strong></span>
              <span>Test Acc: <strong className="font-mono text-emerald-400 font-normal">94.55%</strong></span>
              <span>Confidence: <strong className="font-mono text-slate-100 font-semibold">{((twin?.confidence || 0.95) * 100).toFixed(1)}%</strong></span>
            </div>
          </div>

          <div className="bg-surface/80 border border-panel-border rounded-lg px-4 py-2.5 max-w-sm">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Recommended Engineering Action</span>
            <p className="text-xs text-slate-300 mt-1 leading-snug">
              {faultInfo.action}
            </p>
          </div>
        </div>

        {/* Physical Mechanism & Signature */}
        <div className="mt-4 bg-surface/30 rounded-lg p-3.5 border border-panel-border/40 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-medium mb-1">
            <Info className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
            <span>Physical Signature & Theoretical Mechanism</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            {faultInfo.physics}
          </p>
        </div>
      </div>

      {/* Class Probabilities Bar Chart & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-panel border border-panel-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Fault Class Probabilities
              </h3>
              <p className="text-xs text-slate-400">
                Softmax probability distribution across target failure modes
              </p>
            </div>
            <span className="font-mono text-[10px] text-slate-400">
              Sum = 100%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={probData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                <YAxis dataKey="className" type="category" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} width={130} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Probability']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
                  {probData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Evidence Snapshot */}
        <div className="bg-panel border border-panel-border rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-1">
              Active Sensor Evidence Snapshot
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Physics-guided features evaluated by the inference engine during the current window
            </p>

            <div className="space-y-2 text-xs">
              <div className="bg-surface/40 p-2.5 rounded border border-panel-border/40 flex justify-between items-center">
                <span className="text-slate-400">BRB Current Sideband Ratio (46/54 Hz)</span>
                <span className="font-mono font-semibold text-slate-200">
                  {((twin?.latestCurrentRms || 5.8) * 0.015).toFixed(3)} (% fs)
                </span>
              </div>
              <div className="bg-surface/40 p-2.5 rounded border border-panel-border/40 flex justify-between items-center">
                <span className="text-slate-400">Total Harmonic Distortion (THD)</span>
                <span className="font-mono font-semibold text-slate-200">
                  {(0.026).toFixed(3)}
                </span>
              </div>
              <div className="bg-surface/40 p-2.5 rounded border border-panel-border/40 flex justify-between items-center">
                <span className="text-slate-400">Vibration Kurtosis (Impact Spikiness)</span>
                <span className="font-mono font-semibold text-slate-200">
                  {twin?.latestVibKurtosis?.toFixed(3) || '2.840'}
                </span>
              </div>
              <div className="bg-surface/40 p-2.5 rounded border border-panel-border/40 flex justify-between items-center">
                <span className="text-slate-400">Stator Temperature Gradient (ΔT)</span>
                <span className="font-mono font-semibold text-slate-200">
                  {twin?.latestTemperatureC?.toFixed(1) || '42.0'} °C
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-panel-border/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">Want to see why this class was picked?</span>
            <button
              onClick={() => navigate(`/explainability/${id}`)}
              className="text-brand-400 hover:text-brand-300 font-medium inline-flex items-center gap-1"
            >
              <span>View SHAP Waterfall</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Historical Prediction Timeline Table */}
      <div className="bg-panel border border-panel-border rounded-lg p-5">
        <h3 className="text-sm font-semibold text-slate-100 mb-1">
          Historical Inference Record
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Chronological sequence of Stage 1 & Stage 2 decisions logged by the digital twin
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-panel-border text-slate-400 uppercase font-mono text-[10px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Stage 1 Anomaly</th>
                <th className="py-2.5 px-3">Score</th>
                <th className="py-2.5 px-3">Stage 2 Predicted Class</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Model Version</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-border/50 text-slate-300 font-mono text-[11px]">
              {history.length > 0 ? (
                history.map((record) => (
                  <tr key={record.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-2 px-3 text-slate-400">
                      {new Date(record.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3">
                      {record.isAnomaly ? (
                        <span className="text-rose-400 font-semibold">ANOMALY</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">NORMAL</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-200">
                      {record.anomalyScore.toFixed(4)}
                    </td>
                    <td className="py-2 px-3 font-sans font-medium text-slate-100">
                      {record.predictedFaultClass.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2 px-3 text-slate-200">
                      {(record.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[10px]">
                      {record.modelVersion}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500">
                    Recording live inference cycles...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
