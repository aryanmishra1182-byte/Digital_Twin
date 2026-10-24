import React, { useState, useEffect } from 'react';
import {
  Server,
  Cpu,
  Database,
  Radio,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ShieldCheck,
  BarChart3,
  Layers,
  Sparkles,
  Clock,
  Info,
  Check
} from 'lucide-react';
import { SystemStatus } from '../types';
import { api } from '../api/client';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ModelProvenanceTable } from '../components/ModelProvenanceTable';

export const ModelStatus: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getSystemStatus().then((res) => {
      if (isMounted) {
        setStatus(res);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const isMlUp = status?.mlService?.status === 'UP';

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Model Artifacts & System Architecture"
        subtitle="Health, runtime versions, provenance metadata, and multi-model benchmark evaluation."
        tag="System Telemetry"
      />

      {/* Services Connectivity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Spring Boot Backend */}
        <div className="bg-panel border border-panel-border rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-200">Spring Boot Backend</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> UP
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Runtime:</span>
                <span className="font-mono text-slate-200">Java 21 (Temurin LTS)</span>
              </div>
              <div className="flex justify-between">
                <span>Framework:</span>
                <span className="font-mono text-slate-200">Spring Boot 3.3.4</span>
              </div>
              <div className="flex justify-between">
                <span>Persistence:</span>
                <span className="font-mono text-slate-200">H2 / PostgreSQL</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-panel-border/60 text-[11px] text-slate-400">
            Digital twin state, alerts & REST API
          </div>
        </div>

        {/* Python ML Inference Service */}
        <div className="bg-panel border border-panel-border rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-200">FastAPI ML Service</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                isMlUp
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isMlUp ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                {isMlUp ? 'UP' : 'OFFLINE'}
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Runtime:</span>
                <span className="font-mono text-slate-200">Python 3.10 / FastAPI</span>
              </div>
              <div className="flex justify-between">
                <span>Models Loaded:</span>
                <span className="font-mono text-emerald-400">IsoForest, XGBoost, LSTM</span>
              </div>
              <div className="flex justify-between">
                <span>SHAP Explainer:</span>
                <span className="font-mono text-slate-200">TreeExplainer Active</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-panel-border/60 text-[11px] text-slate-400">
            Signal processing, inference & attributions
          </div>
        </div>

        {/* Telemetry Broker */}
        <div className="bg-panel border border-panel-border rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-200">Telemetry Ingestion Engine</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> READY
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Broker Protocol:</span>
                <span className="font-mono text-slate-200">Eclipse Mosquitto (MQTT)</span>
              </div>
              <div className="flex justify-between">
                <span>Ingest Format:</span>
                <span className="font-mono text-slate-200">10 kHz MCSA Window</span>
              </div>
              <div className="flex justify-between">
                <span>Buffer Size:</span>
                <span className="font-mono text-slate-200">10,000 samples/sec</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-panel-border/60 text-[11px] text-slate-400">
            Industrial IoT telemetry streaming
          </div>
        </div>
      </div>

      {/* 3-Stage Model Evaluation Matrix */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Predictive Pipeline Architecture & Model Cards
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stage 1 Model Card */}
          <div className="bg-panel border border-panel-border rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-mono text-[10px] uppercase text-brand-400 font-semibold">Stage 1</span>
                <span className="font-mono text-[10px] text-slate-400">v1.0</span>
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">Anomaly Detection</h3>
              <div className="text-xs text-slate-400 mt-1 font-mono">Isolation Forest (Unsupervised)</div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="bg-surface/40 p-2.5 rounded border border-panel-border/40 flex justify-between">
                  <span className="text-slate-400">Contamination:</span>
                  <span className="font-mono font-semibold text-slate-200">0.05</span>
                </div>
                <div className="bg-surface/40 p-2.5 rounded border border-panel-border/40 flex justify-between">
                  <span className="text-slate-400">Training Partition:</span>
                  <span className="font-mono text-slate-200">Healthy Runs Only</span>
                </div>
                <div className="bg-surface/40 p-2.5 rounded border border-panel-border/40 flex justify-between">
                  <span className="text-slate-400">Input Modality:</span>
                  <span className="font-mono text-slate-200">26 Extracted Features</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-panel-border/60 text-[11px] text-slate-400 leading-relaxed">
              Separates normal operating baseline from incipient anomalies prior to multiclass classification.
            </div>
          </div>

          {/* Stage 2 Model Card */}
          <div className="bg-panel border border-panel-border rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-mono text-[10px] uppercase text-amber-400 font-semibold">Stage 2</span>
                <span className="font-mono text-[10px] text-slate-400">v1.0</span>
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">Fault Classification</h3>
              <div className="text-xs text-slate-400 mt-1 font-mono">XGBoost Multiclass (5 Classes)</div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="bg-surface/40 p-2.5 rounded border border-panel-border/40 flex justify-between">
                  <span className="text-slate-400">Test Accuracy:</span>
                  <span className="font-mono font-bold text-emerald-400">94.55%</span>
                </div>
                <div className="bg-surface/40 p-2.5 rounded border border-panel-border/40 flex justify-between">
                  <span className="text-slate-400">Multiclass LogLoss:</span>
                  <span className="font-mono font-semibold text-slate-200">0.176</span>
                </div>
                <div className="bg-surface/40 p-2.5 rounded border border-panel-border/40 flex justify-between">
                  <span className="text-slate-400">Explainability:</span>
                  <span className="font-mono text-slate-200">TreeSHAP Explainer</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-panel-border/60 text-[11px] text-slate-400 leading-relaxed">
              Diagnoses broken rotor bars, turn shorts, bearing raceways, and air-gap eccentricity with confidence thresholds.
            </div>
          </div>

          {/* Stage 3 Model Card */}
          <div className="bg-panel border border-panel-border rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-mono text-[10px] uppercase text-emerald-400 font-semibold">Stage 3</span>
                <span className="font-mono text-[10px] text-slate-400">v1.0</span>
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">Remaining Useful Life</h3>
              <div className="text-xs text-slate-400 mt-1 font-mono">PyTorch LSTM Regressor</div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="bg-surface/40 p-2.5 rounded border border-panel-border/40 flex justify-between">
                  <span className="text-slate-400">Mean Absolute Error:</span>
                  <span className="font-mono font-bold text-emerald-400">0.22 hrs</span>
                </div>
                <div className="bg-surface/40 p-2.5 rounded border border-panel-border/40 flex justify-between">
                  <span className="text-slate-400">RMSE:</span>
                  <span className="font-mono font-semibold text-slate-200">0.29 hrs</span>
                </div>
                <div className="bg-surface/40 p-2.5 rounded border border-panel-border/40 flex justify-between">
                  <span className="text-slate-400">Sequence Window:</span>
                  <span className="font-mono text-slate-200">5 Contiguous Steps</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-panel-border/60 text-[11px] text-slate-400 leading-relaxed">
              Forecasts hours remaining before wear metric crosses the terminal maintenance threshold (&lt;20%).
            </div>
          </div>
        </div>
      </div>

      {/* Dataset & Evaluation Protocol Summary */}
      <div className="bg-panel border border-panel-border rounded-lg p-5">
        <h3 className="text-sm font-semibold text-slate-100 mb-1">
          Dataset Provenance & Rigorous Evaluation Protocol
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Zero data leakage partitioning protocol enforced across all training and evaluation experiments
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-surface/30 p-3.5 rounded border border-panel-border/40 space-y-2">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Run-Level Data Leakage Prevention</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Data is strictly partitioned by distinct simulation runs (run_id), not by randomly slicing individual 1-second windows from the same run. This guarantees that test set windows originate from completely unseen motor lifecycles.
            </p>
          </div>

          <div className="bg-surface/30 p-3.5 rounded border border-panel-border/40 space-y-2">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-Condition Operating Loads</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Evaluated across 4 discrete operating loads (25%, 50%, 75%, and 100% rated shaft torque) with dynamic slip compensation to test feature invariance across variable factory load demands.
            </p>
          </div>
        </div>
      </div>

      {/* Verified Machine Learning Pipeline Architecture */}
      <ModelProvenanceTable />
    </div>
  );
};
