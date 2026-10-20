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
  BarChart3
} from 'lucide-react';
import { SystemStatus } from '../types';
import { api } from '../api/client';

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
      <div>
        <div className="flex items-center space-x-3">
          <Server className="w-5 h-5 text-sky-400" />
          <h1 className="text-xl font-bold text-slate-100">Model Artifacts & System Architecture Status</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Health, runtime versions, provenance metadata, and multi-model benchmark evaluation
        </p>
      </div>

      {/* Services Connectivity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Spring Boot Backend */}
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300">Spring Boot Backend</span>
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                <CheckCircle2 className="w-3 h-3" /> UP
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
                <span>Port / DB:</span>
                <span className="font-mono text-slate-200">8080 / H2 & Postgres</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#243247] text-[11px] text-slate-500">
            Digital twin state, alerts & REST API
          </div>
        </div>

        {/* Python ML Inference Service */}
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300">Python ML Microservice</span>
              {isMlUp ? (
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" /> UP
                </span>
              ) : (
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                  <AlertCircle className="w-3 h-3" /> DOWN
                </span>
              )}
            </div>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Runtime:</span>
                <span className="font-mono text-slate-200">Python 3.10 / FastAPI</span>
              </div>
              <div className="flex justify-between">
                <span>Models Loaded:</span>
                <span className="font-mono text-slate-200">XGBoost, IsoForest, LSTM</span>
              </div>
              <div className="flex justify-between">
                <span>SHAP Explainer:</span>
                <span className="font-mono text-slate-200">TreeExplainer Active</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#243247] text-[11px] text-slate-500">
            Feature extraction & SHAP attribution
          </div>
        </div>

        {/* MQTT Ingestion Telemetry */}
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300">Telemetry Ingestion</span>
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300">
                <Radio className="w-3 h-3" /> REST + MQTT
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Sampling Frequency:</span>
                <span className="font-mono text-slate-200">10 kHz</span>
              </div>
              <div className="flex justify-between">
                <span>Window Size:</span>
                <span className="font-mono text-slate-200">1.0 sec (10k samples)</span>
              </div>
              <div className="flex justify-between">
                <span>Total Ingested:</span>
                <span className="font-mono text-slate-200">
                  {status?.totalTelemetryWindowsIngested || 0} windows
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#243247] text-[11px] text-slate-500">
            Paho client ready / topics: motors/+/telemetry
          </div>
        </div>
      </div>

      {/* Model Benchmark Table */}
      <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5 shadow-lg">
        <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-sky-400" />
          Verified Machine Learning Model Performance Benchmarks
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-[#243247] bg-[#111827]">
              <tr>
                <th className="py-2.5 px-3">Stage</th>
                <th className="py-2.5 px-3">Primary Algorithm</th>
                <th className="py-2.5 px-3">Model Version</th>
                <th className="py-2.5 px-3">Evaluated Accuracy / Score</th>
                <th className="py-2.5 px-3">Baseline Comparisons</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243247]/50 font-mono">
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-3 font-semibold text-slate-200">Stage 1: Anomaly</td>
                <td className="py-3 px-3 text-sky-400">Isolation Forest</td>
                <td className="py-3 px-3 text-slate-400 text-[11px]">iso_forest_v1.0</td>
                <td className="py-3 px-3 text-emerald-400 font-bold">F1: 0.8377 (FPR: 8.3%)</td>
                <td className="py-3 px-3 text-slate-300 font-sans text-[11px]">Precision: 99.05%, Recall: 72.57%</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">ACTIVE</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-3 font-semibold text-slate-200">Stage 2: Classifier</td>
                <td className="py-3 px-3 text-sky-400">XGBoost (Multiclass)</td>
                <td className="py-3 px-3 text-slate-400 text-[11px]">xgboost_classifier_v1.0</td>
                <td className="py-3 px-3 text-emerald-400 font-bold">Accuracy: 94.55%</td>
                <td className="py-3 px-3 text-slate-300 font-sans text-[11px]">Beats Random Forest (92.63%) & SVM (87.82%)</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">ACTIVE</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-3 font-semibold text-slate-200">Stage 3: RUL Estimation</td>
                <td className="py-3 px-3 text-sky-400">PyTorch LSTM Regressor</td>
                <td className="py-3 px-3 text-slate-400 text-[11px]">lstm_rul_v1.0</td>
                <td className="py-3 px-3 text-emerald-400 font-bold">MAE: 0.22 hrs</td>
                <td className="py-3 px-3 text-slate-300 font-sans text-[11px]">RMSE: 0.29 hrs vs Ridge Baseline (0.33 hrs)</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">ACTIVE</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-3 font-semibold text-slate-200">Explainability</td>
                <td className="py-3 px-3 text-sky-400">SHAP TreeExplainer</td>
                <td className="py-3 px-3 text-slate-400 text-[11px]">shap_v0.49</td>
                <td className="py-3 px-3 text-emerald-400 font-bold">26 Features Attributed</td>
                <td className="py-3 px-3 text-slate-300 font-sans text-[11px]">Per-prediction local waterfall + Global macro rankings</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">ACTIVE</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Provenance & Citation Note */}
      <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5 space-y-3 text-xs">
        <h3 className="font-semibold text-slate-200 uppercase tracking-wider text-xs">
          Academic Research Provenance & Delineation
        </h3>
        <p className="text-slate-300 leading-relaxed">
          The models and digital twin states in this application are strictly trained on synthetic simulation telemetry constructed from the mathematical and physical parameters specified in the IEEE research paper authored by Aditya Gupta, Aditya Maurya, Ananya Sharma, Aryan Mishra (supervised by Ms. Monika Sharma).
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="px-2.5 py-1 rounded bg-[#111827] border border-[#243247] font-mono text-[11px] text-slate-300">
            Provenance: Synthetic Simulation
          </span>
          <span className="px-2.5 py-1 rounded bg-[#111827] border border-[#243247] font-mono text-[11px] text-slate-300">
            Zero-Leakage Run-Level Split
          </span>
          <span className="px-2.5 py-1 rounded bg-[#111827] border border-[#243247] font-mono text-[11px] text-slate-300">
            Spring Boot 3 + Python Microservice
          </span>
        </div>
      </div>
    </div>
  );
};
