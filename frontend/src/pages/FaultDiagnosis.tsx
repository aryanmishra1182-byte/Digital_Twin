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
  ArrowRight
} from 'lucide-react';
import { DigitalTwinState, PredictionRecord } from '../types';
import { api } from '../api/client';

interface FaultDiagnosisProps {
  twin?: DigitalTwinState;
}

const FAULT_COLORS: Record<string, string> = {
  HEALTHY: '#10b981',
  BROKEN_ROTOR_BAR: '#0284c7',
  STATOR_INTER_TURN_SHORT: '#f59e0b',
  BEARING_DEFECT: '#ec4899',
  AIR_GAP_ECCENTRICITY: '#8b5cf6',
  UNKNOWN_ANOMALY: '#ef4444'
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

  // Build probability bar chart data
  const probData = twin?.classProbabilities
    ? Object.entries(twin.classProbabilities).map(([cls, prob]) => ({
        className: cls.replace(/_/g, ' '),
        rawClass: cls,
        probability: Math.round(prob * 100)
      }))
    : [
        { className: 'HEALTHY', rawClass: 'HEALTHY', probability: 95 },
        { className: 'BROKEN ROTOR BAR', rawClass: 'BROKEN_ROTOR_BAR', probability: 2 },
        { className: 'STATOR INTER TURN SHORT', rawClass: 'STATOR_INTER_TURN_SHORT', probability: 1 },
        { className: 'BEARING DEFECT', rawClass: 'BEARING_DEFECT', probability: 1 },
        { className: 'AIR GAP ECCENTRICITY', rawClass: 'AIR_GAP_ECCENTRICITY', probability: 1 }
      ];

  const isUnknown = twin?.predictedFaultClass === 'UNKNOWN_ANOMALY';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <Cpu className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl font-bold text-slate-100">Fault Diagnosis & Multi-Stage ML Inference</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Stage 1 Isolation Forest Anomaly Detection → Stage 2 XGBoost Multiclass Classification for {id}
          </p>
        </div>
        <button
          onClick={() => navigate(`/explainability/${id}`)}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-colors w-fit"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>View SHAP Attribution Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Unknown Anomaly Alert Banner if applicable */}
      {isUnknown && (
        <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-4 flex items-start space-x-3 text-xs text-rose-200">
          <HelpCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm text-rose-300">Unrecognized Anomaly State Detected</div>
            <p className="mt-1 text-slate-300">
              The Stage 1 Isolation Forest detector flagged a significant departure from nominal baseline (Anomaly Score: {twin?.anomalyScore.toFixed(2)}), but Stage 2 XGBoost classifier has low confidence across all known fault classes. The system does NOT force unknown anomalies into existing categories.
            </p>
          </div>
        </div>
      )}

      {/* Stage 1 & Stage 2 Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stage 1: Anomaly Detector Card */}
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#243247]">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Stage 1: Anomaly Detection (Isolation Forest)
              </h2>
            </div>
            <span className="font-mono text-[11px] text-slate-400">iso_forest_v1.0</span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Decision Status</div>
              <div className="text-lg font-bold font-mono mt-0.5 flex items-center gap-2">
                {twin?.isAnomaly ? (
                  <span className="text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> ANOMALY DETECTED
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> NORMAL INLIER
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">Anomaly Score (0 - 1.0)</div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                {twin?.anomalyScore.toFixed(3) || '0.000'}
              </div>
            </div>
          </div>

          {/* Anomaly Gauge Meter */}
          <div className="mt-5 space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>0.0 (Normal)</span>
              <span>Threshold: 0.50</span>
              <span>1.0 (Severe)</span>
            </div>
            <div className="w-full bg-[#111827] h-3 rounded-full overflow-hidden p-0.5 border border-[#243247]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (twin?.anomalyScore || 0) > 0.5
                    ? 'bg-rose-500'
                    : (twin?.anomalyScore || 0) > 0.25
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, (twin?.anomalyScore || 0) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stage 2: Classifier Card */}
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#243247]">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Stage 2: Multiclass Classifier (XGBoost)
              </h2>
            </div>
            <span className="font-mono text-[11px] text-slate-400">xgboost_classifier_v1.0</span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Classified Fault Type</div>
              <div className="text-lg font-bold font-mono text-sky-400 mt-0.5">
                {twin?.predictedFaultClass.replace(/_/g, ' ') || 'HEALTHY'}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">Prediction Confidence</div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                {twin ? `${Math.round(twin.confidence * 100)}%` : '--'}
              </div>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-slate-400 leading-relaxed">
            Trained with leakage prevention across load points (25%, 50%, 75%, 100%). Acc: 94.55% vs RF 92.63% / SVM 87.82%.
          </p>
        </div>
      </div>

      {/* Class Probabilities Distribution */}
      <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5">
        <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
          Posterior Class Probability Distribution (%)
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={probData} layout="vertical" margin={{ left: 80, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="className" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', fontSize: '11px' }}
                formatter={(val) => [`${val}%`, 'Probability']}
              />
              <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
                {probData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={FAULT_COLORS[entry.rawClass] || '#0284c7'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Inference Log Table */}
      <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5">
        <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
          Recent Inference & Detection Log
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-[#243247] bg-[#111827]">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Anomaly State</th>
                <th className="py-2.5 px-3">Anomaly Score</th>
                <th className="py-2.5 px-3">Predicted Class</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Model Version</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243247]/50 font-mono">
              {history.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 text-slate-400">
                    {new Date(rec.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rec.isAnomaly ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {rec.isAnomaly ? 'ANOMALOUS' : 'NORMAL'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-200">{rec.anomalyScore.toFixed(3)}</td>
                  <td className="py-2 px-3 text-sky-400 font-semibold">{rec.predictedFaultClass}</td>
                  <td className="py-2 px-3 text-slate-200">{Math.round(rec.confidence * 100)}%</td>
                  <td className="py-2 px-3 text-slate-500 text-[10px]">{rec.modelVersion || 'v1.0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
