import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Sparkles,
  Info,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
  Waves,
  Thermometer
} from 'lucide-react';
import { DigitalTwinState, ShapAttribution } from '../types';
import { api } from '../api/client';
import { SectionHeader } from '../components/ui/SectionHeader';

interface ExplainabilityProps {
  twin?: DigitalTwinState;
}

export const Explainability: React.FC<ExplainabilityProps> = ({ twin }) => {
  const { motorId } = useParams<{ motorId: string }>();
  const id = motorId || 'MOTOR-001';

  const [activeTab, setActiveTab] = useState<'LOCAL' | 'GLOBAL' | 'PHYSICS'>('LOCAL');
  const [globalImportance, setGlobalImportance] = useState<{ feature_name: string; mean_abs_shap: number }[]>([]);

  useEffect(() => {
    api.getGlobalImportance().then((data) => {
      if (data && data.global_importance) {
        setGlobalImportance(data.global_importance.slice(0, 10));
      }
    }).catch(() => {});
  }, []);

  const attributions: ShapAttribution[] = twin?.topShapAttributions || [];

  const localChartData = attributions.map((a) => ({
    feature: a.feature_name.replace(/_/g, ' '),
    rawFeature: a.feature_name,
    shapValue: Number(a.shap_value.toFixed(4)),
    absShap: Number(a.abs_shap.toFixed(4)),
    direction: a.direction,
    percentage: a.percentage_contribution || 0,
    featureValue: a.feature_value
  }));

  const globalChartData = globalImportance.map((g) => ({
    feature: g.feature_name.replace(/_/g, ' '),
    importance: Number(g.mean_abs_shap.toFixed(4))
  }));

  const CustomLocalTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositive = data.shapValue > 0;
      return (
        <div className="custom-recharts-tooltip max-w-xs">
          <div className="font-semibold text-slate-100 text-xs mb-1">
            {data.feature}
          </div>
          <div className="font-mono text-[11px] space-y-0.5 text-slate-300">
            <div>Sensor Value: <span className="font-semibold text-slate-100">{data.featureValue?.toFixed(4) ?? 'N/A'}</span></div>
            <div>SHAP Attribution: <span className={`font-semibold ${isPositive ? 'text-amber-400' : 'text-emerald-400'}`}>{data.shapValue > 0 ? `+${data.shapValue}` : data.shapValue}</span></div>
            <div>Relative Impact: <span className="font-semibold text-brand-400">{data.percentage}%</span></div>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-panel-border/60">
              {isPositive ? 'Increases predicted fault risk' : 'Pushes toward healthy baseline'}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title={`SHAP Feature Explainability — ${id}`}
        subtitle="TreeExplainer local and global Shapley feature attribution for XGBoost multiclass model."
        tag="XAI Attribution"
        actions={
          <div className="flex bg-surface p-1 rounded-md border border-panel-border text-xs">
            <button
              onClick={() => setActiveTab('LOCAL')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'LOCAL'
                  ? 'bg-panel text-slate-100 border border-panel-border-strong shadow-subtle'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Instance Attribution
            </button>
            <button
              onClick={() => setActiveTab('GLOBAL')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'GLOBAL'
                  ? 'bg-panel text-slate-100 border border-panel-border-strong shadow-subtle'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Global Fleet Drivers
            </button>
            <button
              onClick={() => setActiveTab('PHYSICS')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'PHYSICS'
                  ? 'bg-panel text-slate-100 border border-panel-border-strong shadow-subtle'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Physics Guide
            </button>
          </div>
        }
      />

      {/* Attribution Context Placard */}
      <div className="bg-panel border border-panel-border rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-panel-border/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Target State Being Explained:</span>
              <span className="font-semibold text-slate-100 text-sm">
                {twin?.predictedFaultClass?.replace(/_/g, ' ') || 'HEALTHY'}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-4">
              <span>Model: <strong className="font-mono text-slate-300 font-normal">TreeExplainer (TreeSHAP)</strong></span>
              <span>Predicted Probability: <strong className="font-mono text-slate-200 font-normal">{((twin?.confidence || 0.95) * 100).toFixed(1)}%</strong></span>
              <span>Explained Features: <strong className="font-mono text-slate-200 font-normal">{attributions.length} dominant</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/30 border border-amber-800/40 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Positive SHAP (Increases Risk)</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/30 border border-emerald-800/40 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Negative SHAP (Supports Normal)</span>
            </div>
          </div>
        </div>

        {/* Informational Guidance */}
        <div className="mt-3.5 flex items-start gap-2.5 text-xs text-slate-400">
          <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Shapley values allocate credit to each input signal component based on game-theoretic marginal contributions. Positive values (<code className="text-amber-300 font-mono">+φ</code>) push the decision towards the indicated fault, whereas negative values (<code className="text-emerald-300 font-mono">-φ</code>) drag the prediction back towards healthy baseline operation.
          </p>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'LOCAL' && (
        <div className="space-y-6">
          {/* Waterfall Divergence Bar Chart */}
          <div className="bg-panel border border-panel-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Local Decision Attributions (Waterfall View)
                </h3>
                <p className="text-xs text-slate-400">
                  Contribution of each physical feature to the current inference window
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Sorted by |φ_i| impact
              </span>
            </div>

            <div className="h-72 w-full">
              {localChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={localChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis dataKey="feature" type="category" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} width={160} />
                    <Tooltip content={<CustomLocalTooltip />} />
                    <Bar dataKey="shapValue" radius={[0, 4, 4, 0]}>
                      {localChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.shapValue >= 0 ? '#f59e0b' : '#10b981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                  Awaiting model attribution computation...
                </div>
              )}
            </div>
          </div>

          {/* Detailed Feature Breakdown Table */}
          <div className="bg-panel border border-panel-border rounded-lg p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-1">
              Top Ranked Contributing Features
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Numerical values and direction of influence for the active prediction
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-panel-border text-slate-400 uppercase font-mono text-[10px]">
                    <th className="py-2.5 px-3">Feature Name</th>
                    <th className="py-2.5 px-3">Measured Value</th>
                    <th className="py-2.5 px-3">SHAP Value (φ)</th>
                    <th className="py-2.5 px-3">Influence Direction</th>
                    <th className="py-2.5 px-3">Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-panel-border/50 text-slate-300 font-mono text-[11px]">
                  {localChartData.map((row) => (
                    <tr key={row.rawFeature} className="hover:bg-surface/30 transition-colors">
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                        {row.feature}
                      </td>
                      <td className="py-2.5 px-3 text-slate-100">
                        {row.featureValue?.toFixed(4) ?? 'N/A'}
                      </td>
                      <td className={`py-2.5 px-3 font-semibold ${row.shapValue >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {row.shapValue > 0 ? `+${row.shapValue}` : row.shapValue}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        {row.direction === 'INCREASES_RISK' ? (
                          <span className="inline-flex items-center gap-1 text-amber-400 text-[11px]">
                            <TrendingUp className="w-3 h-3" /> Elevates Fault Risk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                            <TrendingDown className="w-3 h-3" /> Pulls to Normal
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200 font-semibold">
                        {row.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Global Importance Tab */}
      {activeTab === 'GLOBAL' && (
        <div className="bg-panel border border-panel-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Global Mean Absolute SHAP Values (Fleet-Wide)
              </h3>
              <p className="text-xs text-slate-400">
                Overall predictive importance calculated across the 1,248 dataset sample evaluation set
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Metric: E[|SHAP|]
            </span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={globalChartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis dataKey="feature" type="category" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} width={160} />
                <Tooltip
                  formatter={(val: any) => [val, 'Mean |SHAP|']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="importance" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Physics Guide Tab */}
      {activeTab === 'PHYSICS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-panel border border-panel-border rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Current & MCSA Features</span>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="bg-surface/30 p-2.5 rounded border border-panel-border/40">
                <div className="font-mono font-semibold text-slate-100">current_brb_ratio</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Sideband amplitude at fs(1 ± 2s) relative to fundamental. Primary indicator of broken rotor bars.
                </p>
              </div>
              <div className="bg-surface/30 p-2.5 rounded border border-panel-border/40">
                <div className="font-mono font-semibold text-slate-100">current_harm_3_ratio</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  150 Hz harmonic distortion relative to fundamental. Indicates stator inter-turn copper insulation degradation.
                </p>
              </div>
              <div className="bg-surface/30 p-2.5 rounded border border-panel-border/40">
                <div className="font-mono font-semibold text-slate-100">current_thd</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Total harmonic distortion over first 7 harmonics. Measures non-linear flux distortion.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-panel border border-panel-border rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2 text-violet-400 font-semibold text-xs uppercase tracking-wider">
              <Waves className="w-4 h-4" />
              <span>Vibration Dynamics</span>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="bg-surface/30 p-2.5 rounded border border-panel-border/40">
                <div className="font-mono font-semibold text-slate-100">vib_kurtosis</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  4th statistical moment measuring spikiness. High values indicate sharp bearing raceway flaking impacts.
                </p>
              </div>
              <div className="bg-surface/30 p-2.5 rounded border border-panel-border/40">
                <div className="font-mono font-semibold text-slate-100">vib_bpfo_energy</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Spectral energy concentrated around Ball Pass Frequency Outer (~80 Hz for 6205 bearing at 1440 RPM).
                </p>
              </div>
              <div className="bg-surface/30 p-2.5 rounded border border-panel-border/40">
                <div className="font-mono font-semibold text-slate-100">vib_1x_shaft_amp</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Spectral amplitude at 1x rotational speed (24 Hz). Indicates air-gap static/dynamic eccentricity.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-panel border border-panel-border rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <Thermometer className="w-4 h-4" />
              <span>Thermal Evolution</span>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="bg-surface/30 p-2.5 rounded border border-panel-border/40">
                <div className="font-mono font-semibold text-slate-100">temp_mean & max</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Absolute temperature (°C) of stator casing. Reflects balance between Joule heating and cooling capacity.
                </p>
              </div>
              <div className="bg-surface/30 p-2.5 rounded border border-panel-border/40">
                <div className="font-mono font-semibold text-slate-100">temp_rate_of_rise</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  First derivative d(Temp)/dt in °C/min. Sudden positive rate of rise signals localized fault short circuits.
                </p>
              </div>
              <div className="bg-surface/30 p-2.5 rounded border border-panel-border/40">
                <div className="font-mono font-semibold text-slate-100">load_pct</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Applied shaft torque loading (25%, 50%, 75%, 100%). Modulates nominal slip and expected thermal rise.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
