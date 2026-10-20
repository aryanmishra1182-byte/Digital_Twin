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
  BookOpen
} from 'lucide-react';
import { DigitalTwinState, ShapAttribution } from '../types';
import { api } from '../api/client';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-slate-100">Explainable AI (SHAP) Attribution Layer</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            SHAP TreeExplainer feature attributions for XGBoost fault prediction on {id}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#151d2e] p-1 rounded-lg border border-[#243247] text-xs">
          <button
            onClick={() => setActiveTab('LOCAL')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'LOCAL' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Local Prediction SHAP
          </button>
          <button
            onClick={() => setActiveTab('GLOBAL')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'GLOBAL' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Global Feature Importance
          </button>
          <button
            onClick={() => setActiveTab('PHYSICS')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'PHYSICS' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Physics Consistency
          </button>
        </div>
      </div>

      {/* Academic Disclaimer Box */}
      <div className="bg-[#151d2e] border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3 text-xs text-slate-300">
        <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">Methodology & Explainability Interpretation: </span>
          SHAP attributions indicate model input feature importance toward the predicted fault class according to Shapley cooperative game theory. High SHAP values indicate statistical model reliance, not physical causation. All attributions must be corroborated with MCSA spectral sidebands and vibration harmonics.
        </div>
      </div>

      {/* TAB 1: LOCAL PREDICTION SHAP */}
      {activeTab === 'LOCAL' && (
        <div className="space-y-6">
          {/* Prediction Context Banner */}
          <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400">Current Diagnosis:</span>{' '}
              <span className="font-mono font-bold text-sky-400 text-sm ml-1">
                {twin?.predictedFaultClass.replace(/_/g, ' ') || 'HEALTHY'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Confidence:</span>{' '}
              <span className="font-mono font-bold text-slate-100 ml-1">
                {twin ? `${Math.round(twin.confidence * 100)}%` : '--'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Explainer Method:</span>{' '}
              <span className="font-mono text-slate-300 ml-1">TreeExplainer (TreeEnsemble)</span>
            </div>
          </div>

          {/* Local Attribution Waterfall / Bar Chart */}
          <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
              Top Feature Contributions toward Predicted Class (SHAP Values)
            </h2>
            <p className="text-[11px] text-slate-400 mb-4">
              Positive values (red) increase risk toward the detected fault class; negative values (emerald) push toward healthy baseline.
            </p>

            {localChartData.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500 font-mono">
                No local SHAP attributions recorded yet. Start simulation stream to generate live explanations.
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={localChartData} layout="vertical" margin={{ left: 120, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="feature" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', fontSize: '11px' }}
                      formatter={(val: any, _name, item: any) => [
                        `${val} (${item.payload.percentage}% contribution)`,
                        'SHAP Value'
                      ]}
                    />
                    <Bar dataKey="shapValue" radius={[0, 4, 4, 0]}>
                      {localChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.shapValue > 0 ? '#f43f5e' : '#10b981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Feature Inspection Table */}
          <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Local Attribution Inspection Details
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-400 border-b border-[#243247] bg-[#111827]">
                  <tr>
                    <th className="py-2.5 px-3">Feature Name</th>
                    <th className="py-2.5 px-3">Actual Value</th>
                    <th className="py-2.5 px-3">SHAP Value</th>
                    <th className="py-2.5 px-3">Relative Impact</th>
                    <th className="py-2.5 px-3">Direction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#243247]/50 font-mono">
                  {attributions.map((attr, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-semibold text-slate-200">{attr.feature_name}</td>
                      <td className="py-2 px-3 text-sky-400">{attr.feature_value.toFixed(4)}</td>
                      <td className="py-2 px-3 text-slate-100">{attr.shap_value.toFixed(4)}</td>
                      <td className="py-2 px-3 text-slate-300">
                        {attr.percentage_contribution ? `${attr.percentage_contribution}%` : '--'}
                      </td>
                      <td className="py-2 px-3">
                        {attr.shap_value > 0 ? (
                          <span className="flex items-center text-rose-400 text-[11px]">
                            <TrendingUp className="w-3.5 h-3.5 mr-1" /> Increases Risk
                          </span>
                        ) : (
                          <span className="flex items-center text-emerald-400 text-[11px]">
                            <TrendingDown className="w-3.5 h-3.5 mr-1" /> Decreases Risk
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GLOBAL FEATURE IMPORTANCE */}
      {activeTab === 'GLOBAL' && (
        <div className="space-y-6">
          <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
              Macro Dataset Feature Importance (Mean Absolute SHAP)
            </h2>
            <p className="text-[11px] text-slate-400 mb-4">
              Computed across the held-out test dataset partition. Identifies primary global predictive drivers across all fault modes.
            </p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={globalChartData} layout="vertical" margin={{ left: 140, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="feature" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', fontSize: '11px' }} />
                  <Bar dataKey="importance" fill="#0284c7" radius={[0, 4, 4, 0]} name="Mean |SHAP|" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PHYSICS CONSISTENCY */}
      {activeTab === 'PHYSICS' && (
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5 space-y-5">
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Domain-Grounded Physics-Consistency Evaluation
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            In predictive maintenance, a black-box model may attain high benchmark accuracy while keying on spurious correlations. To ensure scientific fidelity, SHAP attributions are systematically evaluated against known electrical and mechanical induction motor physics equations:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#111827] border border-[#243247] rounded-lg p-4">
              <div className="font-bold text-sky-400 flex items-center gap-1.5 mb-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Broken Rotor Bar Equation
              </div>
              <div className="font-mono text-[11px] bg-[#182235] p-2 rounded text-slate-200 mb-2">
                f_br = fs * (1 ± 2ks), k = 1, 2, ...
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Physics verification: Broken rotor bar classifications consistently attribute top positive SHAP weights to <code className="text-sky-300">brb_sideband_ratio</code> and <code className="text-sky-300">brb_left_sideband_amp</code> (near 46 Hz / 54 Hz for slip s=0.04).
              </p>
            </div>

            <div className="bg-[#111827] border border-[#243247] rounded-lg p-4">
              <div className="font-bold text-sky-400 flex items-center gap-1.5 mb-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Bearing Outer/Inner Race (BPFO/BPFI)
              </div>
              <div className="font-mono text-[11px] bg-[#182235] p-2 rounded text-slate-200 mb-2">
                f_bpfo = (n/2)*fr*(1 - (d/D)*cosα)
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Physics verification: Bearing race spalling produces impulsive impacts; SHAP attributions are dominated by <code className="text-amber-300">vib_kurtosis</code> (&gt; 3.0), <code className="text-amber-300">vib_crest_factor</code>, and <code className="text-amber-300">vib_bpfo_energy</code>.
              </p>
            </div>

            <div className="bg-[#111827] border border-[#243247] rounded-lg p-4">
              <div className="font-bold text-sky-400 flex items-center gap-1.5 mb-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Stator Turn-to-Turn Insulation
              </div>
              <div className="font-mono text-[11px] bg-[#182235] p-2 rounded text-slate-200 mb-2">
                3rd Harmonic (150 Hz) + Thermal dT/dt
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Physics verification: Localized circulating current in shorted turns produces negative sequence distortion and high localized heating; SHAP prioritizes <code className="text-rose-300">current_harm_3_ratio</code> and <code className="text-rose-300">temp_rate_of_rise</code>.
              </p>
            </div>

            <div className="bg-[#111827] border border-[#243247] rounded-lg p-4">
              <div className="font-bold text-sky-400 flex items-center gap-1.5 mb-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Air-Gap Eccentricity
              </div>
              <div className="font-mono text-[11px] bg-[#182235] p-2 rounded text-slate-200 mb-2">
                1x/2x Shaft Harmonics + fs ± fr Sidebands
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Physics verification: Dynamic eccentricity alters air-gap permeance wave, with SHAP correctly identifying <code className="text-indigo-300">vib_1x_shaft_amp</code> and <code className="text-indigo-300">eccentricity_sideband_amp</code>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
