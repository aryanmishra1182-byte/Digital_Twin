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
      <div className="rounded-md bg-white border border-[#E2E8F0] p-4 shadow-sm animate-pulse space-y-2.5">
        <div className="h-4 bg-[#F8FAFC] rounded w-1/3"></div>
        <div className="h-3 bg-[#F8FAFC] rounded w-2/3"></div>
        <div className="space-y-1.5 pt-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-7 bg-[#F8FAFC] rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!attributions || attributions.length === 0) {
    return (
      <div className="rounded-md bg-white border border-[#E2E8F0] p-6 text-center text-[#718096] shadow-sm">
        <Layers className="w-7 h-7 opacity-40 mx-auto mb-2 text-[#355D8B]" />
        <h4 className="text-xs font-semibold text-[#253746]">
          TreeSHAP Attributions Unavailable
        </h4>
        <p className="text-[11px] text-[#718096] mt-0.5 max-w-sm mx-auto">
          SHAP attributions require an active inference window with calculated TreeSHAP feature contributions from the ML service.
        </p>
      </div>
    );
  }

  // Find max absolute SHAP value for scaling bars
  const maxAbsShap = Math.max(...attributions.map((a) => Math.abs(a.shap_value || a.abs_shap || 0.1)));

  return (
    <div className="rounded-md bg-white border border-[#E2E8F0] p-4 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#355D8B]">
              STAGE 4 · EXPLAINABLE AI
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-mono text-[#718096]">
              TreeSHAP Additive Model
            </span>
          </div>
          <div
            className="flex items-center gap-1 text-[11px] text-[#718096] cursor-help"
            title="TreeSHAP computes exact local feature contributions against the background marginal distribution E[f(x)]."
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exact Attribution</span>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-[#253746] mt-1">
          Why did the model predict {faultClass ? faultClass.replace(/_/g, ' ') : 'this condition'}?
        </h3>
        <p className="text-xs text-[#718096] mt-0.5 leading-relaxed">
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
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#C94B50] flex-shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-[#27866F] flex-shrink-0" />
                  )}
                  <span className="font-semibold text-[#253746] truncate">
                    {friendlyName}
                  </span>
                  <span className="text-[10px] text-[#718096] hidden sm:inline">
                    ({attr.feature_name} = {attr.feature_value != null ? Number(attr.feature_value).toFixed(2) : '–'})
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`font-bold ${
                      isPositive ? 'text-[#C94B50]' : 'text-[#27866F]'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {val.toFixed(3)}
                  </span>
                  {attr.percentage_contribution != null && (
                    <span className="text-[10px] text-[#718096] w-10 text-right">
                      {attr.percentage_contribution.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Diverging Bar Track */}
              <div className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden flex relative">
                {/* Center Baseline line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#CBD5E1] z-10" />

                {/* Left Side (Negative / Supports Normal) */}
                <div className="w-1/2 flex justify-end">
                  {!isPositive && (
                    <div
                      className="h-full bg-[#27866F] rounded-l-full transition-all duration-300"
                      style={{ width: `${barWidthPct}%` }}
                    />
                  )}
                </div>

                {/* Right Side (Positive / Increases Fault Likelihood) */}
                <div className="w-1/2 flex justify-start">
                  {isPositive && (
                    <div
                      className="h-full bg-[#C94B50] rounded-r-full transition-all duration-300"
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
      <div className="pt-2.5 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#718096]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-[#C94B50] inline-block" />
            <span className="text-[#C94B50] font-medium">Increases Fault Likelihood (+φ)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-[#27866F] inline-block" />
            <span className="text-[#27866F] font-medium">Supports Normal Operation (-φ)</span>
          </span>
        </div>
        <div>
          Reference: Background Expected Value
        </div>
      </div>
    </div>
  );
};
