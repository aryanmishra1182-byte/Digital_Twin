import React, { useState } from 'react';
import { DigitalTwinState } from '../types';
import { TreeShapChart } from '../components/diagnostics/TreeShapChart';
import { RulDegradationChart } from '../components/diagnostics/RulDegradationChart';
import { getPlainInfo } from '../lib/plain';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import {
  Cpu,
  ShieldAlert,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Wrench,
  Sliders,
  ChevronRight,
  FileText,
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
    <div className="space-y-6 py-6">
      {/* Top Diagnostics Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-aerospace dark:text-aerospace-bright">
              STAGE 1–4 DIAGNOSTIC WORKSPACE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark text-ink-muted">
              XGBoost v1.0 · TreeSHAP · LSTM Regressor
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink dark:text-ink-inverse mt-1">
            Explainable AI Inference & Failure Diagnostics
          </h2>
          <p className="text-xs text-ink-secondary dark:text-ink-muted font-mono mt-0.5">
            Target: {currentTwin?.motorId || 'MOTOR-001'} · Timestamp: {currentTwin?.lastUpdated ? new Date(currentTwin.lastUpdated).toLocaleTimeString() : 'Current'}
          </p>
        </div>

        {/* Quick Scenario Injectors */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono text-ink-muted uppercase mr-1">
            Simulate Fault:
          </span>
          {[
            { id: 'HEALTHY', label: 'Healthy' },
            { id: 'BROKEN_ROTOR_BAR', label: 'Rotor Bar' },
            { id: 'BEARING_DEFECT', label: 'Bearing' },
            { id: 'STATOR_INTER_TURN_SHORT', label: 'Winding' },
          ].map((sc) => (
            <button
              key={sc.id}
              type="button"
              disabled={injecting}
              onClick={() => handleQuickInject(sc.id)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors ${
                faultClass === sc.id
                  ? 'bg-aerospace text-white border-aerospace'
                  : 'bg-panel dark:bg-panel-dark text-ink dark:text-ink-inverse border-rule dark:border-rule-dark hover:bg-surface-secondary dark:hover:bg-panel-dark-subtle'
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Diagnostic Summary Banner */}
      <div className="p-5 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
              Primary Diagnostic Verdict
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  faultClass === 'HEALTHY'
                    ? 'bg-state-normal'
                    : 'bg-state-critical animate-ping'
                }`}
              />
              <h3 className="text-lg sm:text-xl font-bold text-ink dark:text-ink-inverse">
                {plainInfo.verdict}
              </h3>
            </div>
            <p className="text-xs text-ink-secondary dark:text-ink-muted max-w-2xl leading-relaxed">
              {plainInfo.explanation}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right font-mono">
              <span className="text-[10px] text-ink-muted uppercase block">Classifier Confidence</span>
              <span className="text-2xl font-bold text-aerospace dark:text-aerospace-bright">
                {(confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Stage 1 Screener + Stage 2 Classifier Probabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage 1: Isolation Forest Anomaly Screener */}
        <div className="p-5 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-aerospace dark:text-aerospace-bright">
                  STAGE 1 · ANOMALY SCREENER
                </span>
                <span className="px-1.5 py-0.5 rounded bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark text-[10px] font-mono text-ink-muted">
                  Isolation Forest (iso_forest_v1.0)
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  isAnomaly
                    ? 'bg-state-critical-pale text-state-critical border border-state-critical/30'
                    : 'bg-state-normal-pale text-state-normal border border-state-normal/30'
                }`}
              >
                {isAnomaly ? 'ANOMALY DETECTED' : 'NORMAL BEHAVIOR'}
              </span>
            </div>

            <h4 className="text-sm font-semibold text-ink dark:text-ink-inverse mt-2">
              Unsupervised Outlier Decision Boundary
            </h4>
            <p className="text-xs text-ink-secondary dark:text-ink-muted mt-0.5 leading-relaxed">
              Isolation Forest continuously inspects 26 multi-sensor features against the calibrated decision threshold ($\tau = +0.0020$).
            </p>

            {/* Score vs Threshold Visual Bar */}
            <div className="my-6 space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-ink-muted">Calculated Anomaly Score:</span>
                <span className={`font-bold ${isAnomaly ? 'text-state-critical' : 'text-state-normal'}`}>
                  {anomalyScore.toFixed(4)}
                </span>
              </div>

              {/* Bar track */}
              <div className="relative h-4 w-full bg-surface-secondary dark:bg-panel-dark-subtle rounded-md overflow-hidden border border-rule dark:border-rule-dark">
                {/* Threshold line at 35% */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-state-warning z-10"
                  style={{ left: '35%' }}
                  title="Calibrated Threshold τ = +0.0020"
                />
                {/* Score bar */}
                <div
                  className={`h-full transition-all duration-500 ${
                    isAnomaly ? 'bg-state-critical' : 'bg-state-normal'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(5, (anomalyScore / 0.8) * 100))}%`,
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-ink-muted">
                <span>0.000 (Nominal)</span>
                <span className="text-state-warning font-semibold">τ = +0.0020 (Threshold)</span>
                <span>0.800+ (High Outlier)</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-rule dark:border-rule-dark text-[11px] font-mono text-ink-muted">
            Evaluation: Stage 1 Recall 99.45% · FPR 0.17% (2,000 test windows)
          </div>
        </div>

        {/* Stage 2: Multiclass Ranked Probabilities */}
        <div className="p-5 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-aerospace dark:text-aerospace-bright">
                  STAGE 2 · FAULT CLASSIFIER
                </span>
                <span className="px-1.5 py-0.5 rounded bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark text-[10px] font-mono text-ink-muted">
                  XGBoost (xgboost_classifier_v1.0)
                </span>
              </div>
              <span className="font-mono text-xs text-ink-muted">
                Softmax Probabilities
              </span>
            </div>

            <h4 className="text-sm font-semibold text-ink dark:text-ink-inverse mt-2">
              Ranked Multiclass Probability Distribution
            </h4>
            <p className="text-xs text-ink-secondary dark:text-ink-muted mt-0.5 leading-relaxed">
              Calibrated class posterior probabilities across all 5 discrete operating modes.
            </p>

            {/* Probability Bars */}
            <div className="my-4 space-y-2.5">
              {probabilities ? (
                Object.entries(probabilities)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cls, prob]) => {
                    const isChampion = cls === faultClass;
                    return (
                      <div key={cls} className="text-xs font-mono">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className={`font-semibold ${isChampion ? 'text-aerospace dark:text-aerospace-bright' : 'text-ink dark:text-ink-inverse'}`}>
                            {cls.replace(/_/g, ' ')}
                          </span>
                          <span className="font-bold text-ink-muted">
                            {(prob * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-surface-secondary dark:bg-panel-dark-subtle rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isChampion ? 'bg-aerospace' : 'bg-ink-muted/40'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(1, prob * 100))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="py-6 text-center text-xs text-ink-muted font-mono">
                  Posterior probabilities will compute upon live inference receipt.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-rule dark:border-rule-dark text-[11px] font-mono text-ink-muted">
            Held-out Test Evaluation: 2,000 Partitioned Windows (5-Class Calibrated)
          </div>
        </div>
      </div>

      {/* Stage 4 TreeSHAP Waterfall Chart */}
      <TreeShapChart
        attributions={attributions}
        faultClass={faultClass}
      />

      {/* Stage 3 Remaining Useful Life Trajectory */}
      <RulDegradationChart
        rulHours={rulHours}
        healthScore={currentTwin?.healthScore}
      />

      {/* Actionable Maintenance Recommendation Panel */}
      {recommendation && (
        <div className="p-5 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-aerospace" />
              <h3 className="text-sm font-semibold text-ink dark:text-ink-inverse">
                Prescriptive Maintenance Action Checklist
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark text-ink-muted">
              {recommendation.governingStandard || 'IEEE 112 / EPRI'}
            </span>
          </div>

          <h4 className="text-sm font-bold text-ink dark:text-ink-inverse mb-1">
            {recommendation.title}
          </h4>
          <p className="text-xs text-ink-secondary dark:text-ink-muted leading-relaxed mb-4">
            {recommendation.summary}
          </p>

          <div className="space-y-2">
            <span className="text-[11px] font-mono text-ink-muted uppercase block">
              Suggested Field Verification Steps:
            </span>
            <ul className="space-y-2 text-xs">
              {recommendation.suggestedActions?.map((act, i) => (
                <li key={i} className="flex items-start gap-2 text-ink dark:text-ink-inverse">
                  <CheckCircle2 className="w-3.5 h-3.5 text-state-normal flex-shrink-0 mt-0.5" />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-rule dark:border-rule-dark text-[10px] text-ink-muted font-mono">
            {recommendation.safetyDisclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
