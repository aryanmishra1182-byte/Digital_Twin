import React, { useState } from 'react';
import { X, Play, Square, Activity, AlertCircle } from 'lucide-react';
import { SimulatorStatus } from '../types';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  status?: SimulatorStatus;
  onStart: (motorId: string, scenario: string, severity: number, loadPct: number) => void;
  onStop: () => void;
  defaultMotorId: string;
}

const SCENARIOS = [
  { id: 'HEALTHY', name: 'Healthy Operation (Normal)', desc: 'Nominal 50 Hz fundamental current, low vibration, steady temp' },
  { id: 'BROKEN_ROTOR_BAR', name: 'Broken Rotor Bar', desc: 'Current sidebands at fs*(1 +/- 2s) ~ 46 Hz and 54 Hz' },
  { id: 'STATOR_INTER_TURN_SHORT', name: 'Stator Turn Short', desc: 'Elevated 3rd harmonic (150 Hz), negative sequence, hotspot heating' },
  { id: 'BEARING_DEFECT', name: 'Bearing Race Defect', desc: 'Impulsive vibration at BPFO (~80 Hz) and BPFI, high kurtosis' },
  { id: 'AIR_GAP_ECCENTRICITY', name: 'Air-Gap Eccentricity', desc: '1x shaft rotational vibration, fs +/- fr current sidebands' },
];

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  isOpen,
  onClose,
  status,
  onStart,
  onStop,
  defaultMotorId
}) => {
  const [motorId, setMotorId] = useState(defaultMotorId);
  const [scenario, setScenario] = useState('BROKEN_ROTOR_BAR');
  const [severity, setSeverity] = useState(0.7);
  const [loadPct, setLoadPct] = useState(100);

  if (!isOpen) return null;

  const handleStart = () => {
    onStart(motorId, scenario, severity, loadPct);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#151d2e] border border-[#243247] rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#243247] bg-[#111827]">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Motor Telemetry Simulator Panel</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status Banner */}
          <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
            status?.isRunning
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
          }`}>
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${status?.isRunning ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="font-medium">
                {status?.isRunning
                  ? `Active Scenario: ${status.scenario} (${status.ticksEmitted} windows emitted)`
                  : 'Simulator is currently Idle'}
              </span>
            </div>
            {status?.isRunning && (
              <span className="font-mono text-amber-300">Temp: {status.currentTempC}°C</span>
            )}
          </div>

          {/* Motor Select */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Motor Asset</label>
            <select
              value={motorId}
              onChange={(e) => setMotorId(e.target.value)}
              className="w-full bg-[#182235] border border-[#243247] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="MOTOR-001">MOTOR-001 (Primary Feed Pump - 3kW)</option>
              <option value="MOTOR-002">MOTOR-002 (Cooling Fan Drive - 3kW)</option>
            </select>
          </div>

          {/* Fault Scenario */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Fault Injection Scenario</label>
            <div className="space-y-2">
              {SCENARIOS.map((sc) => (
                <label
                  key={sc.id}
                  className={`flex items-start p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    scenario === sc.id
                      ? 'bg-sky-500/15 border-sky-500/50 text-slate-100'
                      : 'bg-[#182235]/60 border-[#243247] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="scenario"
                    value={sc.id}
                    checked={scenario === sc.id}
                    onChange={(e) => setScenario(e.target.value)}
                    className="mt-0.5 mr-2.5 text-sky-500 focus:ring-0"
                  />
                  <div>
                    <div className="font-medium text-xs">{sc.name}</div>
                    <div className="text-[11px] text-slate-400">{sc.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Severity & Load Controls */}
          {scenario !== 'HEALTHY' && (
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Fault Severity Level</span>
                <span className="text-sky-400 font-mono font-semibold">{Math.round(severity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={severity}
                onChange={(e) => setSeverity(parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          )}

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Operating Load Point</span>
              <span className="text-sky-400 font-mono font-semibold">{loadPct}%</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((ld) => (
                <button
                  key={ld}
                  type="button"
                  onClick={() => setLoadPct(ld)}
                  className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    loadPct === ld
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                      : 'bg-[#182235] border-[#243247] text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {ld}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#111827] border-t border-[#243247] flex items-center justify-between">
          <div className="flex items-center text-[11px] text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Synthesizes 10 kHz current & vibration streams
          </div>
          <div className="flex space-x-3">
            {status?.isRunning ? (
              <button
                onClick={onStop}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Stop Stream</span>
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/30"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Scenario</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
