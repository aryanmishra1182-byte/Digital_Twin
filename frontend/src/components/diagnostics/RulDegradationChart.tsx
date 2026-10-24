import React from 'react';
import { Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface RulDegradationChartProps {
  rulHours: number | null;
  rulUnit?: string;
  healthScore?: number;
  modelVersion?: string;
}

export const RulDegradationChart: React.FC<RulDegradationChartProps> = ({
  rulHours,
  rulUnit = 'hours',
  healthScore = 100,
  modelVersion = 'lstm_rul_v1.0',
}) => {
  const isHealthy = rulHours == null || rulHours > 48;
  const isUrgent = rulHours != null && rulHours <= 24;

  // Generate synthetic trajectory curve for visualization:
  // Degradation curve from 100% health down to 0% failure threshold
  // Total baseline lifespan = 72 hours
  const totalLifespan = 72;
  const currentRemaining = rulHours ?? (isHealthy ? 68.5 : 20.0);
  const currentElapsed = Math.max(0, totalLifespan - currentRemaining);
  const currentHealth = Math.max(5, Math.min(100, healthScore));

  const width = 500;
  const height = 180;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 25;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  // Create degradation curve points: exponential decay curve
  const curvePoints: [number, number][] = [];
  for (let h = 0; h <= totalLifespan; h += 3) {
    const x = paddingLeft + (h / totalLifespan) * plotWidth;
    // Health decay: 100 * (1 - (h / totalLifespan)^1.8)
    const normalizedHealth = Math.max(0, 1 - Math.pow(h / totalLifespan, 1.8));
    const y = height - paddingBottom - normalizedHealth * plotHeight;
    curvePoints.push([x, y]);
  }

  const pathString = curvePoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join(' ');

  // Current operating point on curve
  const currentX = paddingLeft + (Math.min(totalLifespan, currentElapsed) / totalLifespan) * plotWidth;
  const currentY = height - paddingBottom - (currentHealth / 100) * plotHeight;

  // Failure threshold line Y (at 20% health)
  const failureThresholdY = height - paddingBottom - 0.2 * plotHeight;

  return (
    <div className="rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark p-5 flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-aerospace dark:text-aerospace-bright">
              STAGE 3 · REMAINING USEFUL LIFE
            </span>
            <span className="px-1.5 py-0.5 rounded bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark text-[10px] font-mono text-ink-muted">
              LSTM Sequence Regressor ({modelVersion})
            </span>
          </div>
          <Clock className="w-4 h-4 text-aerospace" />
        </div>

        <div className="mt-3 flex items-baseline gap-3">
          <div className="text-2xl sm:text-3xl font-mono font-bold text-ink dark:text-ink-inverse">
            {rulHours != null ? (
              <>
                {rulHours.toFixed(1)} <span className="text-xs font-normal text-ink-muted">{rulUnit}</span>
              </>
            ) : (
              <span className="text-base text-state-normal font-sans font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Normal Life Expectancy (&gt;48 hrs)
              </span>
            )}
          </div>
          {isUrgent && (
            <span className="px-2 py-0.5 rounded bg-state-critical-pale text-state-critical text-xs font-mono font-semibold border border-state-critical/30 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> ACTION RECOMMENDED
            </span>
          )}
        </div>
        <p className="text-xs text-ink-secondary dark:text-ink-muted mt-1">
          Estimated operational window until component failure threshold ($H &lt; 20\%$) under current load.
        </p>
      </div>

      {/* Trajectory Graph */}
      <div className="relative w-full aspect-[16/7] min-h-[160px] my-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none" preserveAspectRatio="none">
          {/* Horizontal Grid */}
          {[0, 0.5, 1].map((r) => {
            const y = paddingTop + r * plotHeight;
            const healthPct = Math.round((1 - r) * 100);
            return (
              <g key={`rul-grid-${r}`}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" />
                <text x={paddingLeft - 8} y={y + 3.5} textAnchor="end" fill="currentColor" fillOpacity="0.5" fontSize="9" fontFamily="JetBrains Mono">
                  {healthPct}%
                </text>
              </g>
            );
          })}

          {/* Failure Threshold Line */}
          <line x1={paddingLeft} y1={failureThresholdY} x2={width - paddingRight} y2={failureThresholdY} stroke="#EF4444" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.8" />
          <text x={width - paddingRight} y={failureThresholdY - 4} textAnchor="end" fill="#EF4444" fontSize="8.5" fontFamily="JetBrains Mono" fontWeight="bold">
            Critical Threshold (20% Health)
          </text>

          {/* Theoretical Degradation Trajectory Curve */}
          <path d={pathString} fill="none" stroke="#2458D3" strokeWidth="2" strokeDasharray="4 2" opacity="0.6" />

          {/* Current Operating Point Pin */}
          <g transform={`translate(${currentX}, ${currentY})`}>
            <circle cx="0" cy="0" r="12" fill="#EF4444" opacity="0.2" className="animate-ping" />
            <circle cx="0" cy="0" r="6" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
            {/* Callout */}
            <rect x="-35" y="-28" width="70" height="20" rx="3" fill="#101B2A" stroke="#EF4444" strokeWidth="1" />
            <text x="0" y="-14" textAnchor="middle" fill="#F4F7FB" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
              Current State
            </text>
          </g>

          {/* Time Axis Labels */}
          <text x={paddingLeft} y={height - 6} fill="currentColor" fillOpacity="0.5" fontSize="8.5" fontFamily="JetBrains Mono">
            T=0h (Commissioning)
          </text>
          <text x={width - paddingRight} y={height - 6} textAnchor="end" fill="currentColor" fillOpacity="0.5" fontSize="8.5" fontFamily="JetBrains Mono">
            T=72h (Failure Limit)
          </text>
        </svg>
      </div>

      {/* Scientific Limitation Disclosure */}
      <div className="pt-2 border-t border-rule dark:border-rule-dark text-[10px] text-ink-muted leading-tight font-mono">
        Provenience: Multi-law synthetic degradation trajectories. Sequence window: 5 intervals.
      </div>
    </div>
  );
};
