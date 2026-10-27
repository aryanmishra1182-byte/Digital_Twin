import React, { useState } from 'react';
import { DigitalTwinState } from '../types';
import { TreeShapChart } from '../components/diagnostics/TreeShapChart';
import { RulDegradationChart } from '../components/diagnostics/RulDegradationChart';
import { getPlainInfo } from '../lib/plain';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import {
  Cpu,
  CheckCircle2,
  Wrench,
  Zap,
} from 'lucide-react';

interface DiagnosticsPageProps {
  selectedMotorId: string;
  twins: DigitalTwinState[];
  onRefresh?: () => void;
}

export const DiagnosticsPage: React.FC<DiagnosticsPageProps> = ({
  selectedMotorId,
  twins,
  onRefresh,
}) => {
  const { showToast } = useToast();
  const [injecting, setInjecting] = useState(false);

  const currentTwin = twins.find((t) => t.motorId === selectedMotorId) || twins[0] || null;

  const faultClass = currentTwin?.predictedFaultClass || 'HEALTHY';
  const confidence = currentTwin?.confidence ?? 1.0;
  const isAnomaly = currentTwin?.isAnomaly ?? false;
  const anomalyScore = currentTwin?.anomalyScore ?? 0.0;
  const rulHours = currentTwin?.estimatedRulHours ?? null;
  const attributions = currentTwin?.topShapAttributions || null;
  const probabilities = currentTwin?.classProbabilities || null;
  const recommendation = currentTwin?.latestMaintenanceRecommendation || null;

  const plainInfo = getPlainInfo(faultClass);

  // Quick Scenario Injection handler
  const handleQuickInject = async (scenario: string) => {
    setInjecting(true);
    try {
      await api.startSimulator(currentTwin?.motorId || 'MOTOR-001', scenario, 0.65, 100);
      showToast('success', 'Scenario Injected', `Injected ${scenario} fault. Updating AI diagnostics.`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast('error', 'Injection Failed', err.message);
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      {/* Top Diagnostics Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              AI Diagnostics — Multistage Inference Pipeline
            </h2>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#0B202C] text-[#9B6DCC] border border-[#1C3B4E]">
              4 STAGES
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
            Stage 1 Anomaly Detection · Stage 2 Fault Classifier · Stage 3 RUL Regressor · Stage 4 TreeSHAP Explainability
          </p>
        </div>

        {/* Quick Scenario Injectors */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono text-[#94A3B8] uppercase mr-1">
            Simulate Fault:
          </span>
          {[
            { id: 'HEALTHY', label: 'Healthy' },
            { id: 'BROKEN_ROTOR_BAR', label: 'Rotor Bar' },
            { id: 'BEARING_DEFECT', label: 'Bearing Defect' },
            { id: 'STATOR_INTER_TURN_SHORT', label: 'Winding Short' },
            { id: 'AIR_GAP_ECCENTRICITY', label: 'Eccentricity' },
          ].map((sc) => (
            <button
              key={sc.id}
              type="button"
              disabled={injecting}
              onClick={() => handleQuickInject(sc.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border transition-colors ${
                faultClass === sc.id
                  ? 'bg-[#68409A] text-white border-[#68409A] font-semibold'
                  : 'bg-[#0B202C] text-[#94A3B8] border-[#1C3B4E] hover:text-white'
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Diagnostic Verdict Card */}
      <div className="rounded-md bg-white border border-[#E2E8F0] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#718096]">
              Target Unit: {currentTwin?.motorId || 'MOTOR-001'} · Primary Diagnostic Verdict
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  faultClass === 'HEALTHY'
                    ? 'bg-[#27866F]'
                    : 'bg-[#C94B50]'
                }`}
              />
              <h3 className="text-lg font-bold text-[#253746]">
                {plainInfo.verdict}
              </h3>
            </div>
            <p className="text-xs text-[#718096] max-w-2xl leading-relaxed">
              {plainInfo.explanation}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right font-mono p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] text-[#718096] uppercase block">Classifier Probability</span>
              <span className="text-2xl font-bold text-[#355D8B]">
                {(confidence * 100).toFixed(1)}%
              </span>
              <span className="text-[9px] text-[#718096] block">Model Posterior</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Stage 1 Screener + Stage 2 Classifier Probabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Stage 1: Isolation Forest Anomaly Screener */}
        <div className="rounded-md bg-white border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="h-9 px-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded bg-[#27866F]" />
                <h4 className="font-mono text-xs font-bold text-[#253746] uppercase tracking-wider">
                  Stage 1 — Unsupervised Anomaly Screener
                </h4>
              </div>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                  isAnomaly
                    ? 'bg-[#C94B50]/15 text-[#C94B50]'
                    : 'bg-[#27866F]/15 text-[#27866F]'
                }`}
              >
                {isAnomaly ? 'FLAGGED' : 'NOMINAL'}
              </span>
            </div>

            <div className="p-3.5 space-y-3">
              <p className="text-xs text-[#718096] leading-relaxed">
                Isolation Forest continuously screens 26 multi-sensor features against the calibrated baseline decision threshold ($\tau = +0.0020$).
              </p>

              {/* Score vs Threshold Visual Bar */}
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#718096]">Empirical Anomaly Score:</span>
                  <span className={`font-bold ${isAnomaly ? 'text-[#C94B50]' : 'text-[#27866F]'}`}>
                    {anomalyScore.toFixed(4)}
                  </span>
                </div>

                {/* Bar track */}
                <div className="relative h-3 w-full bg-[#E2E8F0] rounded overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-[#D99A35] z-10"
                    style={{ left: '35%' }}
                    title="Calibrated Threshold τ = +0.0020"
                  />
                  <div
                    className={`h-full transition-all duration-300 ${
                      isAnomaly ? 'bg-[#C94B50]' : 'bg-[#27866F]'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(5, (anomalyScore / 0.8) * 100))}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between text-[9px] text-[#718096]">
                  <span>0.000 (Nominal)</span>
                  <span className="text-[#D99A35] font-semibold">τ = +0.0020 (Threshold)</span>
                  <span>0.800+ (High Outlier)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] text-[10px] font-mono text-[#718096]">
            Algorithm: Isolation Forest · 26 Time-Frequency Features · Zero Supervision Required
          </div>
        </div>

        {/* Stage 2: Multiclass Ranked Probabilities */}
        <div className="rounded-md bg-white border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="h-9 px-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded bg-[#355D8B]" />
                <h4 className="font-mono text-xs font-bold text-[#253746] uppercase tracking-wider">
                  Stage 2 — Multiclass Fault Classifier
                </h4>
              </div>
              <span className="font-mono text-[10px] text-[#718096]">
                XGBoost Posterior
              </span>
            </div>

            <div className="p-3.5 space-y-2.5">
              <p className="text-xs text-[#718096] leading-relaxed">
                Ranked posterior probability distribution across all 5 discrete operating modes.
              </p>

              <div className="space-y-2">
                {probabilities ? (
                  Object.entries(probabilities)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cls, prob]) => {
                      const isChampion = cls === faultClass;
                      return (
                        <div key={cls} className="text-xs font-mono">
                          <div className="flex items-center justify-between text-[11px] mb-0.5">
                            <span className={`font-semibold ${isChampion ? 'text-[#355D8B]' : 'text-[#253746]'}`}>
                              {cls.replace(/_/g, ' ')}
                            </span>
                            <span className="font-bold text-[#718096]">
                              {(prob * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isChampion ? 'bg-[#355D8B]' : 'bg-[#94A3B8]'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(1, prob * 100))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="py-4 text-center text-xs text-[#718096] font-mono">
                    Posterior probabilities will display upon live telemetry reception.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] text-[10px] font-mono text-[#718096]">
            Model: Champion XGBoost (400 Estimators) · Probability reflects model confidence, not certainty
          </div>
        </div>
      </div>

      {/* Stage 3: Remaining Useful Life Trajectory */}
      <div className="rounded-md bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="h-9 px-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded bg-[#68409A]" />
            <h4 className="font-mono text-xs font-bold text-[#253746] uppercase tracking-wider">
              Stage 3 — Remaining Useful Life (RUL) Trajectory
            </h4>
          </div>
          <span className="text-[10px] font-mono text-[#718096]">
            Multi-Law Degradation Simulation
          </span>
        </div>

        <div className="p-3.5">
          <RulDegradationChart
            rulHours={rulHours}
            healthScore={currentTwin?.healthScore}
          />
          <div className="mt-2 text-[10px] font-mono text-[#718096] border-t border-[#E2E8F0] pt-2">
            Research Note: RUL estimates are generated from simulated multi-law degradation trajectories. Physical validation on real-world industrial machinery requires continuous longitudinal run-to-failure tracking.
          </div>
        </div>
      </div>

      {/* Stage 4: TreeSHAP Attribution Waterfall */}
      <div className="rounded-md bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="h-9 px-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded bg-[#355D8B]" />
            <h4 className="font-mono text-xs font-bold text-[#253746] uppercase tracking-wider">
              Stage 4 — Explainable AI: Exact TreeSHAP Local Attributions
            </h4>
          </div>
          <span className="text-[10px] font-mono text-[#718096]">
            Additive Feature Contributions ($\phi_i$)
          </span>
        </div>

        <div className="p-3.5">
          <TreeShapChart
            attributions={attributions}
            faultClass={faultClass}
          />
        </div>
      </div>

      {/* Prescriptive Field Action Checklist */}
      {recommendation && (
        <div className="rounded-md bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="h-9 px-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-[#355D8B]" />
              <h4 className="font-mono text-xs font-bold text-[#253746] uppercase tracking-wider">
                Prescriptive Maintenance Checklist
              </h4>
            </div>
            <span className="text-[10px] font-mono text-[#718096]">
              {recommendation.governingStandard || 'IEEE 112 / EPRI Standards'}
            </span>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <h5 className="text-sm font-bold text-[#253746]">
                {recommendation.title}
              </h5>
              <p className="text-xs text-[#718096] leading-relaxed mt-0.5">
                {recommendation.summary}
              </p>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono text-[#718096] uppercase block">
                Recommended Verification Steps:
              </span>
              <ul className="space-y-1.5 text-xs">
                {recommendation.suggestedActions?.map((act, i) => (
                  <li key={i} className="flex items-start gap-2 text-[#253746]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#27866F] flex-shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] text-[10px] text-[#718096] font-mono">
              {recommendation.safetyDisclaimer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
