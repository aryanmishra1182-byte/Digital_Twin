import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

export const ModelProvenanceTable: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.getMotorMetrics()
      .then(data => {
        if (mounted) {
          setMetrics(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const cpuModel = metrics?.latency?.benchmark_metadata?.cpu_model || 'Hardware CPU';

  const rows = [
    {
      stage: 'Stage 1: Anomaly Detector',
      model: 'Isolation Forest (n=150, threshold tuned)',
      input: '26 Handcrafted Physics Features',
      testSplit: metrics?.anomaly ? `${metrics.anomaly.test_samples} Held-Out Windows` : 'Held-Out Test Split',
      metric: metrics?.anomaly
        ? `Recall: ${(metrics.anomaly.recall * 100).toFixed(2)}% · F1: ${(metrics.anomaly.f1 * 100).toFixed(2)}%`
        : 'Loading...',
      latency: metrics?.latency?.latencies?.stage_1_isolation_forest
        ? `${metrics.latency.latencies.stage_1_isolation_forest.p50_ms.toFixed(2)} ms (p50) · ${metrics.latency.latencies.stage_1_isolation_forest.p95_ms.toFixed(2)} ms (p95)`
        : 'Benchmarking...',
      provenance: 'SIMULATED DATA',
      provColor: 'bg-warn/15 text-warn border-warn/30'
    },
    {
      stage: 'Stage 2: Fault Classifier',
      model: 'XGBoost Multiclass (140 Trees, Balanced)',
      input: '26 Standardized Features (MCSA + Vib)',
      testSplit: metrics?.classifier ? `${metrics.classifier.test_samples} Held-Out Windows` : 'Held-Out Test Split',
      metric: metrics?.classifier
        ? `Acc: ${(metrics.classifier.accuracy * 100).toFixed(2)}% · Macro F1: ${(metrics.classifier.f1_macro * 100).toFixed(2)}%`
        : 'Loading...',
      latency: metrics?.latency?.latencies?.stage_2_xgboost
        ? `${metrics.latency.latencies.stage_2_xgboost.p50_ms.toFixed(2)} ms (p50) · ${metrics.latency.latencies.stage_2_xgboost.p95_ms.toFixed(2)} ms (p95)`
        : 'Benchmarking...',
      provenance: 'SIMULATED DATA',
      provColor: 'bg-warn/15 text-warn border-warn/30'
    },
    {
      stage: 'Stage 3: RUL Degradation',
      model: 'Sequence LSTM (32h, 2-layer, 5-window)',
      input: '5-Window Historical Sequence (Multi-Law)',
      testSplit: metrics?.rul ? `${metrics.rul.test_sequences} Sequences (${metrics.rul.held_out_runs} Held-Out Runs)` : 'Held-Out Test Runs',
      metric: metrics?.rul
        ? `MAE: ${metrics.rul.mae_hours.toFixed(2)} h · RMSE: ${metrics.rul.rmse_hours.toFixed(2)} h`
        : 'Loading...',
      latency: metrics?.latency?.latencies?.stage_3_lstm_rul
        ? `${metrics.latency.latencies.stage_3_lstm_rul.p50_ms.toFixed(2)} ms (p50) · ${metrics.latency.latencies.stage_3_lstm_rul.p95_ms.toFixed(2)} ms (p95)`
        : 'Benchmarking...',
      provenance: 'SIMULATED DATA',
      provColor: 'bg-warn/15 text-warn border-warn/30'
    },
    {
      stage: 'Stage 4: Local Attribution',
      model: 'Fast TreeSHAP (TreeExplainer)',
      input: 'Physics-Guided Feature Vector',
      testSplit: 'Continuous Streaming Windows',
      metric: metrics?.quality_checks?.measurable_explainability
        ? `Physics Consistency: ${(metrics.quality_checks.measurable_explainability.physics_consistency_score * 100).toFixed(1)}%`
        : 'Measured Live',
      latency: metrics?.latency?.latencies?.stage_4_shap_attribution
        ? `${metrics.latency.latencies.stage_4_shap_attribution.p50_ms.toFixed(2)} ms (p50) · ${metrics.latency.latencies.stage_4_shap_attribution.p95_ms.toFixed(2)} ms (p95)`
        : 'Benchmarking...',
      provenance: 'SIMULATED DATA',
      provColor: 'bg-warn/15 text-warn border-warn/30'
    },
    {
      stage: 'Real Bearing Benchmark',
      model: 'XGBoost on CWRU 12k Accelerometer',
      input: 'Vibration Time + Spectral Features (10 kHz resampled)',
      testSplit: metrics?.cwru ? `${metrics.cwru.within_dataset_performance?.test_windows || 20} Held-Out Real Windows (Load 3)` : 'Held-Out Real Windows',
      metric: metrics?.cwru
        ? `Within-Dataset Acc: ${(metrics.cwru.within_dataset_performance.accuracy * 100).toFixed(1)}% (Zero-Shot: ${(metrics.cwru.sim_to_real_fine_tuning_experiment?.k_0?.accuracy_mean * 100).toFixed(1)}%)`
        : 'Loading...',
      latency: metrics?.latency?.latencies?.stage_2_xgboost
        ? `${metrics.latency.latencies.stage_2_xgboost.p50_ms.toFixed(2)} ms (p50)`
        : 'Benchmarking...',
      provenance: 'REAL PHYSICAL DATA',
      provColor: 'bg-ok/15 text-ok border-ok/30'
    }
  ];

  return (
    <div className="py-6">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-4">
        <div>
          <h3 className="text-xl font-serif font-normal text-ink">
            Machine Learning Pipeline Architecture & Provenance
          </h3>
          <p className="text-xs text-mute mt-1 font-sans">
            Verified hyperparameters, held-out evaluation splits, and empirically benchmarked latencies ({cpuModel})
          </p>
        </div>
      </div>

      <div className="overflow-x-auto border border-rule rounded bg-panel">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="border-b border-rule bg-bg/50 text-mute uppercase font-mono text-[10px]">
              <th className="py-3 px-4">Pipeline Stage</th>
              <th className="py-3 px-4">Champion Architecture</th>
              <th className="py-3 px-4">Test Split / Semantics</th>
              <th className="py-3 px-4">Verified Test Performance</th>
              <th className="py-3 px-4">Hardware Latency</th>
              <th className="py-3 px-4">Data Provenance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule/60">
            {rows.map((m, idx) => (
              <tr key={idx} className="hover:bg-track/50 transition-colors">
                <td className="py-3 px-4 font-medium text-ink">
                  {m.stage}
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-mute">
                  {m.model}
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-mute">
                  {m.testSplit}
                </td>
                <td className="py-3 px-4 font-mono text-ink font-medium">
                  {m.metric}
                </td>
                <td className="py-3 px-4 font-mono text-mute">
                  {m.latency}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border font-medium ${m.provColor}`}>
                    {m.provenance}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
