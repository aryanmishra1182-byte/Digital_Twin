import React from 'react';
import { ShapAttribution } from '../../types';
import { getFriendlyFeatureName } from '../../lib/plain';
import { HelpCircle, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

interface TreeShapChartProps {
  attributions?: ShapAttribution[] | null;
  faultClass?: string;
  loading?: boolean;
}

export const TreeShapChart: React.FC<TreeShapChartProps> = ({
  attributions,
  faultClass,
  loading,
}) => {
  if (loading) {
    return (
      <div className="rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark p-5 animate-pulse space-y-3">
        <div className="h-5 bg-surface-secondary dark:bg-panel-dark-subtle rounded w-1/3"></div>
        <div className="h-4 bg-surface-secondary dark:bg-panel-dark-subtle rounded w-2/3"></div>
        <div className="space-y-2 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-surface-secondary dark:bg-panel-dark-subtle rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!attributions || attributions.length === 0) {
    return (
      <div className="rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark p-6 text-center text-ink-muted">
        <Layers className="w-8 h-8 opacity-40 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-ink dark:text-ink-inverse">
          TreeSHAP Attributions Unavailable
        </h4>
        <p className="text-xs text-ink-secondary dark:text-ink-muted mt-1 max-w-sm mx-auto">
          SHAP attributions require an active inference window with calculated TreeSHAP feature contributions from the ML service.
        </p>
      </div>
    );
  }

  // Find max absolute SHAP value for scaling bars
  const maxAbsShap = Math.max(...attributions.map((a) => Math.abs(a.shap_value || a.abs_shap || 0.1)));

  return (
    <div className="rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark p-5 flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-aerospace dark:text-aerospace-bright">
              STAGE 4 · EXPLAINABLE AI
            </span>
            <span className="px-1.5 py-0.5 rounded bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark text-[10px] font-mono text-ink-muted">
              TreeSHAP Additive Model
            </span>
          </div>
          <div
            className="flex items-center gap-1 text-[11px] text-ink-muted cursor-help"
            title="TreeSHAP computes exact local feature contributions against the background marginal distribution E[f(x)]."
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exact Attribution</span>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-ink dark:text-ink-inverse mt-1">
          Why did the model predict {faultClass ? faultClass.replace(/_/g, ' ') : 'this condition'}?
        </h3>
        <p className="text-xs text-ink-secondary dark:text-ink-muted mt-0.5 leading-relaxed">
          Diverging attribution waterfall showing how each sensor measurement pushes the decision toward or away from this diagnosis.
        </p>
      </div>

      {/* Diverging Waterfall Bar Chart */}
      <div className="my-5 space-y-3">
        {attributions.slice(0, 6).map((attr, idx) => {
          const val = attr.shap_value;
          const isPositive = val > 0 || attr.direction === 'INCREASES_RISK';
          const friendlyName = getFriendlyFeatureName(attr.feature_name);
          const barWidthPct = Math.min(100, (Math.abs(val) / (maxAbsShap || 1)) * 100);

          return (
            <div key={`${attr.feature_name}-${idx}`} className="text-xs">
              <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                <div className="flex items-center gap-1.5 min-w-0">
                  {isPositive ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-state-critical flex-shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-state-normal flex-shrink-0" />
                  )}
                  <span className="font-semibold text-ink dark:text-ink-inverse truncate">
                    {friendlyName}
                  </span>
                  <span className="text-[10px] text-ink-muted hidden sm:inline">
                    ({attr.feature_name} = {attr.feature_value != null ? Number(attr.feature_value).toFixed(2) : '–'})
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`font-bold ${
                      isPositive ? 'text-state-critical' : 'text-state-normal'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {val.toFixed(3)}
                  </span>
                  {attr.percentage_contribution != null && (
                    <span className="text-[10px] text-ink-muted w-10 text-right">
                      {attr.percentage_contribution.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Diverging Bar Track */}
              <div className="h-2 w-full bg-surface-secondary dark:bg-panel-dark-subtle rounded-full overflow-hidden flex relative">
                {/* Center Baseline line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-rule dark:bg-rule-dark z-10" />

                {/* Left Side (Negative / Decreases Risk) */}
                <div className="w-1/2 flex justify-end">
                  {!isPositive && (
                    <div
                      className="h-full bg-state-normal rounded-l-full transition-all duration-300"
                      style={{ width: `${barWidthPct}%` }}
                    />
                  )}
                </div>

                {/* Right Side (Positive / Increases Risk) */}
                <div className="w-1/2 flex justify-start">
                  {isPositive && (
                    <div
                      className="h-full bg-state-critical rounded-r-full transition-all duration-300"
                      style={{ width: `${barWidthPct}%` }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Baseline Legend */}
      <div className="pt-3 border-t border-rule dark:border-rule-dark flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-ink-muted">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-state-critical inline-block" />
            <span className="text-state-critical font-medium">Increases Fault Likelihood</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-state-normal inline-block" />
            <span className="text-state-normal font-medium">Supports Normal Operation</span>
          </span>
        </div>
        <div>
          Reference: $\mathbb&#123;E&#125;[f(x)]$ Background Baseline
        </div>
      </div>
    </div>
  );
};
