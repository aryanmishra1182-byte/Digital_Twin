import React, { useState, useEffect } from 'react';
import {
  Cpu,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Info,
  Sliders,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Gauge,
  Zap,
  Thermometer,
  Wrench,
  HelpCircle
} from 'lucide-react';
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
import { api } from '../api/client';
import { Ai4iTestCase, Ai4iPredictionResponse } from '../types';
import { SectionHeader } from '../components/ui/SectionHeader';

export const PredictiveMaintenance: React.FC = () => {
  const [testCases, setTestCases] = useState<Ai4iTestCase[]>([]);
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // What-if interactive parameters
  const [airTemp, setAirTemp] = useState(300.0);
  const [processTemp, setProcessTemp] = useState(310.0);
  const [speed, setSpeed] = useState(1500.0);
  const [torque, setTorque] = useState(40.0);
  const [toolWear, setToolWear] = useState(120.0);
  const [machineType, setMachineType] = useState('M');

  const [prediction, setPrediction] = useState<Ai4iPredictionResponse | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Fetch benchmark test cases on load
  useEffect(() => {
    let isMounted = true;
    api.getAi4iTestCases().then((cases) => {
      if (isMounted && cases && cases.length > 0) {
        setTestCases(cases);
        loadCase(cases[0]);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const loadCase = (tc: Ai4iTestCase) => {
    setAirTemp(tc.features.Air_temperature_K);
    setProcessTemp(tc.features.Process_temperature_K);
    setSpeed(tc.features.Rotational_speed_rpm);
    setTorque(tc.features.Torque_Nm);
    setToolWear(tc.features.Tool_wear_min);
    setMachineType(tc.type);
    runInference(tc.features.Air_temperature_K, tc.features.Process_temperature_K, tc.features.Rotational_speed_rpm, tc.features.Torque_Nm, tc.features.Tool_wear_min, tc.type);
  };

  const runInference = async (
    at = airTemp,
    pt = processTemp,
    sp = speed,
    tq = torque,
    tw = toolWear,
    mt = machineType
  ) => {
    setEvaluating(true);
    try {
      const res = await api.predictAi4i({
        air_temp_k: at,
        process_temp_k: pt,
        rotational_speed_rpm: sp,
        torque_nm: tq,
        tool_wear_min: tw,
        machine_type: mt
      });
      setPrediction(res);
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const activeCase = testCases[selectedCaseIdx];

  // Plain language explanation synthesis
  const generatePlainExplanation = (pred: Ai4iPredictionResponse | null) => {
    if (!pred) return 'Awaiting model inference...';
    if (!pred.is_failure_predicted) {
      return 'The machine is operating safely within nominal industrial tolerances. Rotational speed, torque, and temperatures are in healthy equilibrium. No intervention is required.';
    }
    const topFeature = pred.top_shap_attributions[0];
    if (topFeature.feature === 'Overstrain_Metric' || topFeature.feature === 'Torque_Nm') {
      return `Elevated torque load (${pred.evidence.Torque_Nm} Nm) combined with tool wear (${pred.evidence.Tool_wear_min} min) is placing severe mechanical overstrain on the machine. Without reducing torque, tool failure or workpiece fracture is predicted.`;
    }
    if (topFeature.feature === 'Temp_difference_K' || topFeature.feature === 'Process_temperature_K') {
      return `Insufficient heat dissipation detected. Process temperature (${pred.evidence.Process_temperature_K} K) is too close to ambient air temperature, leading to thermal buildup and potential heat dissipation failure.`;
    }
    if (topFeature.feature === 'Rotational_speed_rpm' || topFeature.feature === 'Mechanical_Power_W') {
      return `Abnormal mechanical power output (${pred.evidence.Mechanical_Power_W?.toFixed(0)} W) at ${pred.evidence.Rotational_speed_rpm} RPM indicates drive power excursion. Inspect supply power and motor drive inverter.`;
    }
    return `Model predicts machine failure with ${(pred.failure_probability * 100).toFixed(1)}% probability based on cumulative wear indicators.`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Predictive Maintenance & Machine Failure Diagnosis"
        subtitle="Plain-language failure forecasts, probability assessments, and explainable root-cause factors powered by the champion XGBoost model."
        tag="AI4I 2020 Benchmark"
      />

      {/* Benchmark Test Cases Selector */}
      <div className="bg-panel border border-panel-border rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Select Real-World Benchmark Equipment Record
            </h3>
            <p className="text-xs text-slate-400">
              Evaluate actual ground-truth test cases from the UCI AI4I 2020 industrial dataset
            </p>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            {testCases.length} Ground-Truth Test Cases
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {testCases.map((tc, idx) => {
            const isFailure = tc.actual_failure === 1;
            const isSelected = idx === selectedCaseIdx;
            return (
              <button
                key={tc.udi}
                type="button"
                onClick={() => {
                  setSelectedCaseIdx(idx);
                  loadCase(tc);
                }}
                className={`p-2 rounded border text-left transition-all ${
                  isSelected
                    ? 'bg-brand-600/15 border-brand-500 text-slate-100 font-semibold'
                    : 'bg-surface/40 border-panel-border text-slate-400 hover:border-panel-border-strong hover:text-slate-300'
                }`}
              >
                <div className="font-mono text-[11px] flex items-center justify-between">
                  <span>#{tc.udi}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isFailure ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                </div>
                <div className="text-[10px] mt-0.5 truncate text-slate-300">
                  {tc.failure_mode}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Prediction & Plain Language Assessment Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Primary Prediction Placard */}
        <div className="lg:col-span-7 bg-panel border border-panel-border rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-panel-border/60">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  Equipment State Assessment
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <div className={`w-3.5 h-3.5 rounded-full ${
                    prediction?.is_failure_predicted ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                  }`} />
                  <h2 className="text-xl font-bold text-slate-100">
                    {prediction?.is_failure_predicted ? 'Machine Failure Predicted' : 'Normal Equipment Operation'}
                  </h2>
                </div>
              </div>

              {/* Risk Level Badge */}
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Risk Level</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded font-mono text-xs font-bold mt-0.5 ${
                  prediction?.risk_level === 'CRITICAL' ? 'bg-rose-950/60 text-rose-300 border border-rose-800' :
                  prediction?.risk_level === 'ELEVATED' ? 'bg-amber-950/60 text-amber-300 border border-amber-800' :
                  'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                }`}>
                  {prediction?.risk_level || 'EVALUATING'}
                </span>
              </div>
            </div>

            {/* Probability Gauge & Failure/Healthy Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div className="bg-surface/40 p-4 rounded-lg border border-panel-border">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">
                  Failure Probability
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={`text-3xl font-mono font-bold ${
                    (prediction?.failure_probability || 0) >= 0.5 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {((prediction?.failure_probability || 0) * 100).toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-400">Decision cutoff: 50%</span>
                </div>
                <div className="mt-2.5 h-1.5 w-full bg-surface rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(prediction?.failure_probability || 0) * 100}%` }}
                    className={`h-full ${
                      (prediction?.failure_probability || 0) >= 0.5 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <div className="bg-surface/40 p-4 rounded-lg border border-panel-border flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">
                    Ground-Truth Benchmark Match
                  </span>
                  <div className="mt-1 text-sm font-semibold text-slate-200">
                    Actual: {activeCase?.actual_failure ? `Failure (${activeCase.failure_mode})` : 'Healthy Baseline'}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Model: {prediction?.is_failure_predicted ? 'Failure' : 'Healthy'} ({
                      (activeCase?.actual_failure === (prediction?.is_failure_predicted ? 1 : 0))
                        ? '✓ Correct Match'
                        : 'Uncertain'
                    })
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-400 pt-2 border-t border-panel-border/40">
                  Equipment Variant: Quality Class {machineType}
                </div>
              </div>
            </div>

            {/* Plain Language Explanation */}
            <div className="mt-5 bg-surface/30 p-4 rounded-lg border border-panel-border text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-200 mb-1">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>Plain-Language Diagnostic Assessment</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                {generatePlainExplanation(prediction)}
              </p>
            </div>

            {/* Recommended Action */}
            <div className="mt-4 p-4 rounded-lg bg-brand-950/20 border border-brand-800/40 text-xs">
              <div className="flex items-center gap-2 font-semibold text-brand-300 mb-1">
                <Wrench className="w-4 h-4 text-brand-400" />
                <span>Recommended Engineering Next Action</span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed">
                {prediction?.recommendation || 'Maintain standard scheduled inspection.'}
              </p>
            </div>
          </div>

          {/* Important Caveat */}
          <div className="mt-5 pt-3 border-t border-panel-border/60 flex items-start gap-2 text-[11px] text-slate-400">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Predictive Horizon Distinction: </strong> A predicted failure indicates elevated operational wear under current torque/speed dynamics. It is NOT an instantaneous emergency trip; maintenance should be scheduled before wear breaches safety limits.
            </p>
          </div>
        </div>

        {/* Right: Interactive "What-If" Parameter Simulator */}
        <div className="lg:col-span-5 bg-panel border border-panel-border rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-panel-border/60">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-semibold text-slate-100">
                  Interactive "What-If" Operating Adjuster
                </h3>
              </div>
              <button
                type="button"
                onClick={() => activeCase && loadCase(activeCase)}
                title="Reset to benchmark case values"
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 mb-4 leading-relaxed">
              Adjust operating conditions to observe how changes in torque, speed, and tool wear alter the failure probability in real-time.
            </p>

            <div className="space-y-3.5 text-xs">
              {/* Torque */}
              <div className="bg-surface/30 p-2.5 rounded border border-panel-border/40">
                <div className="flex justify-between font-mono mb-1">
                  <span className="text-slate-300">Torque:</span>
                  <span className="font-semibold text-brand-400">{torque.toFixed(1)} Nm</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="1"
                  value={torque}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setTorque(val);
                    runInference(airTemp, processTemp, speed, val, toolWear, machineType);
                  }}
                  className="w-full accent-brand-500 h-1.5 bg-panel-border rounded-lg cursor-pointer"
                />
              </div>

              {/* Rotational Speed */}
              <div className="bg-surface/30 p-2.5 rounded border border-panel-border/40">
                <div className="flex justify-between font-mono mb-1">
                  <span className="text-slate-300">Rotational Speed:</span>
                  <span className="font-semibold text-brand-400">{speed.toFixed(0)} RPM</span>
                </div>
                <input
                  type="range"
                  min="1100"
                  max="2800"
                  step="25"
                  value={speed}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setSpeed(val);
                    runInference(airTemp, processTemp, val, torque, toolWear, machineType);
                  }}
                  className="w-full accent-brand-500 h-1.5 bg-panel-border rounded-lg cursor-pointer"
                />
              </div>

              {/* Tool Wear Time */}
              <div className="bg-surface/30 p-2.5 rounded border border-panel-border/40">
                <div className="flex justify-between font-mono mb-1">
                  <span className="text-slate-300">Tool Wear Duration:</span>
                  <span className="font-semibold text-brand-400">{toolWear.toFixed(0)} min</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="250"
                  step="5"
                  value={toolWear}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setToolWear(val);
                    runInference(airTemp, processTemp, speed, torque, val, machineType);
                  }}
                  className="w-full accent-brand-500 h-1.5 bg-panel-border rounded-lg cursor-pointer"
                />
              </div>

              {/* Process Temperature */}
              <div className="bg-surface/30 p-2.5 rounded border border-panel-border/40">
                <div className="flex justify-between font-mono mb-1">
                  <span className="text-slate-300">Process Temperature:</span>
                  <span className="font-semibold text-brand-400">{processTemp.toFixed(1)} K</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="315"
                  step="0.5"
                  value={processTemp}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setProcessTemp(val);
                    runInference(airTemp, val, speed, torque, toolWear, machineType);
                  }}
                  className="w-full accent-brand-500 h-1.5 bg-panel-border rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-panel-border/60 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Model Engine:</span>
            <span className="text-slate-300 font-semibold">XGBoost 3.x (AI4I Champion)</span>
          </div>
        </div>
      </div>

      {/* "Why This Prediction?" SHAP Feature Attribution Section */}
      <div className="bg-panel border border-panel-border rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-panel-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-semibold text-slate-100">
                Why this prediction? — SHAP Attribution Factors
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Shapley game-theoretic attributions showing which input variables increased failure risk vs supported normalcy.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-xs text-brand-400 hover:text-brand-300 inline-flex items-center gap-1 font-medium"
          >
            <span>{showTechnicalDetails ? 'Hide Technical Details' : 'Expand Technical Details'}</span>
            {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* SHAP Waterfall Chart */}
        <div className="mt-5">
          <div className="h-64 w-full">
            {prediction?.top_shap_attributions && prediction.top_shap_attributions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={prediction.top_shap_attributions.map((a) => ({
                    feature: a.feature.replace(/_/g, ' '),
                    shap_value: a.shap_value,
                    direction: a.direction,
                    value: a.value
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis dataKey="feature" type="category" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} width={160} />
                  <Tooltip
                    formatter={(val: any) => [val, 'SHAP Value (φ)']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="shap_value" radius={[0, 4, 4, 0]}>
                    {prediction.top_shap_attributions.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.shap_value >= 0 ? '#f43f5e' : '#10b981'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                Computing Shapley feature attributions...
              </div>
            )}
          </div>
          <div className="flex justify-center gap-6 mt-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Positive SHAP (Elevates Failure Risk)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Negative SHAP (Indicates Healthy Condition)
            </span>
          </div>
        </div>

        {/* Optional Expandable Technical Section for Researchers */}
        {showTechnicalDetails && (
          <div className="mt-6 pt-5 border-t border-panel-border/60 text-xs space-y-4">
            <h4 className="font-semibold text-slate-200 uppercase font-mono text-[11px] tracking-wider">
              Mathematical & Methodological Details for Researchers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
              <div className="bg-surface/30 p-3.5 rounded border border-panel-border/40">
                <span className="font-semibold text-slate-200 block mb-1">TreeSHAP Additive Efficiency</span>
                <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                  f(x) = φ₀ + Σ φ_i(x), where φ₀ is the base expected value across the training distribution, and each φ_i is the exact Shapley attribution for feature i.
                </p>
              </div>

              <div className="bg-surface/30 p-3.5 rounded border border-panel-border/40">
                <span className="font-semibold text-slate-200 block mb-1">Correlation vs. Causation Caution</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  High SHAP importance identifies strong statistical sensitivity in the tree splits. However, attribution does not establish independent physical causation without controlled experimental perturbation.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
