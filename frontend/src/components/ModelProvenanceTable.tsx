import React from 'react';

export const ModelProvenanceTable: React.FC = () => {
  const models = [
    {
      stage: 'Stage 1: Anomaly Detector',
      model: 'Isolation Forest (n=150, c=0.05)',
      input: '26 Handcrafted Physics Features',
      testSplit: '312 Windows (52 Held-Out Runs)',
      metric: 'Recall: 72.57% · F1: 49.38%',
      latency: '9.13 ms (p50) · 11.35 ms (p95)',
      provenance: 'SIMULATED DATA',
      provColor: 'bg-warn/15 text-warn border-warn/30'
    },
    {
      stage: 'Stage 2: Fault Classifier',
      model: 'XGBoost Multiclass (120 Trees)',
      input: '26 Standardized Features (MCSA + Vib)',
      testSplit: '312 Windows (52 Held-Out Runs)',
      metric: 'Acc: 94.55% · Macro F1: 88.62%',
      latency: '1.30 ms (p50) · 1.84 ms (p95)',
      provenance: 'SIMULATED DATA',
      provColor: 'bg-warn/15 text-warn border-warn/30'
    },
    {
      stage: 'Stage 3: RUL Degradation',
      model: 'Unidirectional LSTM (32h, 2-layer)',
      input: '5-Window Historical Sequence (10s)',
      testSplit: '4 Held-Out Runs (384 Sequences)',
      metric: 'MAE: 0.220 h · RMSE: 0.293 h',
      latency: '1.15 ms (p50) · 1.45 ms (p95)',
      provenance: 'SIMULATED DATA',
      provColor: 'bg-warn/15 text-warn border-warn/30'
    },
    {
      stage: 'Stage 4: Local Attribution',
      model: 'Fast TreeSHAP (TreeExplainer)',
      input: 'Physics-Guided Feature Vector',
      testSplit: 'Continuous Streaming Windows',
      metric: 'Physics Consistency: 90.97%',
      latency: '3.62 ms (p50) · 5.08 ms (p95)',
      provenance: 'SIMULATED DATA',
      provColor: 'bg-warn/15 text-warn border-warn/30'
    },
    {
      stage: 'Real Bearing Benchmark',
      model: 'XGBoost on CWRU 12k Accelerometer',
      input: 'Vibration Time + Spectral Features',
      testSplit: '20 Held-Out CWRU Windows',
      metric: 'Acc: 100.0% (Sim-to-Real: 72.5%)',
      latency: '1.25 ms (p50) · 1.60 ms (p95)',
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
            Verified hyperparameters, held-out evaluation splits, and benchmarked inference latencies (AMD Ryzen 5 4600H CPU)
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
            {models.map((m, idx) => (
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
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${m.provColor}`}>
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
