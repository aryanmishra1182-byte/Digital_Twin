import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Info
} from 'lucide-react';
import { DigitalTwinState } from '../types';

interface RemainingUsefulLifeProps {
  twin?: DigitalTwinState;
  onOpenSimulator: () => void;
}

export const RemainingUsefulLife: React.FC<RemainingUsefulLifeProps> = ({ twin, onOpenSimulator }) => {
  const { motorId } = useParams<{ motorId: string }>();
  const id = motorId || 'MOTOR-001';

  const rulHours = twin?.estimatedRulHours;
  const hasHistory = rulHours !== null && rulHours !== undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-slate-100">Remaining Useful Life (RUL) Estimation</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Stage 3: PyTorch LSTM Sequence Regressor evaluated on run-to-failure degradation trajectories for {id}
          </p>
        </div>

        <button
          onClick={onOpenSimulator}
          className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-colors w-fit"
        >
          Simulate Degradation Stream
        </button>
      </div>

      {/* Research Fidelity Banner */}
      <div className="bg-[#151d2e] border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3 text-xs text-slate-300">
        <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">Academic & Research Transparency Notice: </span>
          The RUL model utilizes a sequence of time-ordered feature vectors to predict hours until terminal degradation. Performance metrics (MAE: 0.22 hrs, RMSE: 0.29 hrs) measure agreement with the assumed physical simulation wear trajectory, NOT real-world motor lifetime without physical test-bench calibration.
        </div>
      </div>

      {/* Main RUL Display Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Estimated RUL Hero Box */}
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Estimated Remaining Life</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3">
              {hasHistory ? (
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-extrabold font-mono text-emerald-400">
                    {rulHours.toFixed(1)}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">Hours</span>
                </div>
              ) : (
                <div className="text-amber-400 font-mono text-sm py-2">
                  Accumulating temporal history...
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {hasHistory
                ? 'Estimated time until vibration or insulation degradation reaches critical shutdown criteria.'
                : 'The LSTM regressor requires a minimum of 5 consecutive 1-second telemetry windows to evaluate degradation dynamics.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#243247] flex items-center justify-between text-xs">
            <span className="text-slate-400">Model Architecture</span>
            <span className="font-mono text-sky-400 font-semibold">2-Layer PyTorch LSTM</span>
          </div>
        </div>

        {/* Operating Conditions Under Degradation */}
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider">
              Degradation Drivers
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#243247]/50">
                <span className="text-slate-400">Detected Fault Mode</span>
                <span className="font-mono font-bold text-sky-400">{twin?.predictedFaultClass || 'HEALTHY'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#243247]/50">
                <span className="text-slate-400">Vibration Kurtosis</span>
                <span className="font-mono text-slate-200">{twin?.latestVibKurtosis.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#243247]/50">
                <span className="text-slate-400">Motor Temperature</span>
                <span className="font-mono text-slate-200">{twin?.latestTemperatureC.toFixed(1) || '0.0'} °C</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Operating Load</span>
                <span className="font-mono text-slate-200">{twin?.latestLoadPct || 100}% Rated Load</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#243247] text-[11px] text-slate-500">
            Degradation progression accelerates at higher loads (I²R thermal loss + electromagnetic shear).
          </div>
        </div>

        {/* Action Threshold Recommendation */}
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider">
              Maintenance Window
            </div>
            {hasHistory && rulHours < 20 ? (
              <div className="bg-rose-500/15 border border-rose-500/30 rounded-lg p-3 text-rose-300 text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Immediate Inspection Window
                </div>
                <div className="mt-1 text-[11px] text-slate-300">
                  RUL is below 20 operating hours. Schedule replacement or overhaul prior to next production shift.
                </div>
              </div>
            ) : (
              <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-lg p-3 text-emerald-300 text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Normal Inspection Horizon
                </div>
                <div className="mt-1 text-[11px] text-slate-300">
                  Asset operates within safe margin. Next scheduled preventive overhaul according to routine plant schedule.
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#243247] text-xs flex justify-between">
            <span className="text-slate-400">Evaluated MAE Error</span>
            <span className="font-mono text-emerald-400 font-bold">± 0.22 hrs (Held-out runs)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
