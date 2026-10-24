import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

export const About: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMotorMetrics()
      .then(m => setMetrics(m))
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, []);

  // Compute metrics from API response
  const classifierAcc = metrics?.classifier?.accuracy != null
    ? `${Math.round(metrics.classifier.accuracy * 100)}%`
    : '–';

  const rulMae = metrics?.rul?.mae_hours != null
    ? `${metrics.rul.mae_hours.toFixed(1)} h`
    : '–';

  const fullLat = metrics?.latency?.latencies?.full_production_pipeline?.p50_ms ??
    metrics?.latency?.latencies?.full_production_pipeline?.mean_ms;
  const speedMs = fullLat != null ? `${Math.round(fullLat)} ms` : '–';

  const testCount = metrics?.classifier?.test_samples ??
    metrics?.classifier?.test_windows_count;

  const fpr = metrics?.anomaly?.false_positive_rate;
  const fprPct = fpr != null ? (fpr * 100).toFixed(1) : null;

  const provenanceStr = metrics?.classifier?.provenance ||
    metrics?.anomaly?.provenance ||
    'Synthetic simulation of IEEE 3 kW 4-pole motor';

  const cwru = metrics?.cwru;
  const cwruFilesCount = cwru?.file_sha256_hashes?.length || 12;
  const cwruAcc = cwru?.within_dataset_performance?.accuracy != null
    ? `${Math.round(cwru.within_dataset_performance.accuracy * 100)}%`
    : null;

  return (
    <div className="space-y-10 py-6">
      {/* 1. What it does */}
      <section aria-labelledby="what-heading" className="space-y-3">
        <h1 id="what-heading" className="text-2xl font-serif text-ink font-normal">About MACHINA-X</h1>
        <p className="text-base text-ink leading-relaxed">
          MACHINA-X monitors industrial three-phase induction motors using electrical current, vibration, and temperature readings.
          It watches for early signs of mechanical wear, identifies the specific fault, and estimates how much operating time remains.
          Plant operators receive plain-language guidance to schedule maintenance before unplanned motor shutdowns occur.
        </p>
      </section>

      {/* 2. How well it works */}
      <section aria-labelledby="performance-heading" className="space-y-4 pt-6 border-t border-rule">
        <h2 id="performance-heading" className="text-lg font-serif">How well it works</h2>

        {loading ? (
          <div className="grid grid-cols-3 gap-4 animate-pulse">
            <div className="h-20 bg-panel rounded"></div>
            <div className="h-20 bg-panel rounded"></div>
            <div className="h-20 bg-panel rounded"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded bg-panel border border-rule space-y-1">
              <span className="font-mono text-3xl font-bold text-ink">{classifierAcc}</span>
              <span className="block text-sm text-mute">Finds the right fault</span>
            </div>

            <div className="p-4 rounded bg-panel border border-rule space-y-1">
              <span className="font-mono text-3xl font-bold text-ink">{rulMae}</span>
              <span className="block text-sm text-mute">Remaining-life error</span>
            </div>

            <div className="p-4 rounded bg-panel border border-rule space-y-1">
              <span className="font-mono text-3xl font-bold text-ink">{speedMs}</span>
              <span className="block text-sm text-mute">Speed</span>
            </div>
          </div>
        )}

        <p className="text-xs text-mute font-mono">
          Based on {testCount ? `${testCount.toLocaleString()} held-out test readings` : 'benchmark test readings'} evaluated across multiple motor loads.
        </p>
      </section>

      {/* 3. Things to know (honest limits) */}
      <section aria-labelledby="limits-heading" className="space-y-4 pt-6 border-t border-rule">
        <h2 id="limits-heading" className="text-lg font-serif">Things to know (honest limits)</h2>

        <div className="space-y-3 text-sm text-ink leading-relaxed">
          <div className="p-3.5 rounded bg-panel border border-rule space-y-1">
            <p className="font-medium text-ink">Simulated motor training</p>
            <p className="text-mute text-xs">
              These results come from computer-simulated motors, not from a real factory.
              Data source: <span className="font-mono">{provenanceStr}</span>.
            </p>
          </div>

          {fprPct !== null && (
            <div className="p-3.5 rounded bg-panel border border-rule space-y-1">
              <p className="font-medium text-ink">First-stage screening note</p>
              <p className="text-mute text-xs">
                The first screening step wrongly flags {fprPct}% of healthy readings.
                The second stage then reviews the readings to filter out false alarms.
              </p>
            </div>
          )}

          <div className="p-3.5 rounded bg-panel border border-rule space-y-1">
            <p className="font-medium text-ink">Advisory decision support</p>
            <p className="text-mute text-xs">
              Advice only; it never switches a motor off. Operators must inspect equipment in person before taking physical action.
            </p>
          </div>

          {/* Real physical bearing data (separate block) */}
          {cwru && (
            <div className="p-3.5 rounded bg-panel border border-rule space-y-1">
              <p className="font-medium text-ink">Real bearing data</p>
              <p className="text-mute text-xs">
                Physical testbed measurements from {cwruFilesCount} accelerometer recordings (Case Western Reserve University bearing benchmark).
                {cwruAcc && ` Achieved ${cwruAcc} accuracy on held-out physical bearing tests.`}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 4. How it works (Closed disclosure for technical details) */}
      <details className="pt-6 border-t border-rule cursor-pointer text-sm">
        <summary className="font-serif text-lg text-ink hover:text-mute select-none">
          How it works
        </summary>
        <div className="mt-4 p-5 rounded bg-panel border border-rule space-y-4 text-sm leading-relaxed text-mute">
          <ol className="list-decimal list-inside space-y-3 text-ink">
            <li>
              <strong className="text-ink">Collect readings:</strong> Sensors capture stator current, mechanical vibration and housing temperature in one-second windows.
            </li>
            <li>
              <strong className="text-ink">Spot unusual behaviour:</strong> An unsupervised Isolation Forest screens incoming telemetry for deviation from nominal operation.
            </li>
            <li>
              <strong className="text-ink">Name the likely fault:</strong> An XGBoost classifier identifies whether the motor is healthy or experiencing a broken rotor bar, winding short, bearing wear, or air-gap misalignment.
            </li>
            <li>
              <strong className="text-ink">Explain why:</strong> TreeSHAP attribution assigns an exact importance weight to each sensor metric so technicians understand why a prediction was made.
            </li>
          </ol>
        </div>
      </details>
    </div>
  );
};
