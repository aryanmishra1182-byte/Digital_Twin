import React, { useState } from 'react';
import { X, Play, Square, Activity, Info, Sliders, Zap, Thermometer } from 'lucide-react';
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
  {
    id: 'HEALTHY',
    name: 'Healthy Baseline',
    desc: 'Pure 50 Hz fundamental stator current, nominal vibration (<0.3 mm/s RMS), thermal equilibrium.',
    physics: 'fs = 50.0 Hz, slip s ≈ 0.04'
  },
  {
    id: 'BROKEN_ROTOR_BAR',
    name: 'Broken Rotor Bar',
    desc: 'Motor current signature analysis (MCSA) sidebands appear around fundamental.',
    physics: 'f_br = fs(1 ± 2s) → ~46.0 Hz and ~54.0 Hz'
  },
  {
    id: 'STATOR_INTER_TURN_SHORT',
    name: 'Stator Turn Short',
    desc: 'Localized insulation breakdown causing 3rd harmonic current distortion and thermal rise.',
    physics: '3rd harmonic (150 Hz), ΔT > 25°C rise'
  },
  {
    id: 'BEARING_DEFECT',
    name: 'Bearing Race Defect',
    desc: 'Impulsive vibration shocks as rolling elements pass flaked raceways.',
    physics: 'BPFO (~80 Hz), kurtosis > 3.0'
  },
  {
    id: 'AIR_GAP_ECCENTRICITY',
    name: 'Air-Gap Eccentricity',
    desc: 'Rotor-stator asymmetry inducing 1x shaft rotational speed vibration and flux distortion.',
    physics: 'fr = 24.0 Hz shaft harmonic'
  },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="bg-panel border border-panel-border rounded-xl max-w-xl w-full shadow-elevated overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-panel-border bg-canvas-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Telemetry Signal Generator</h3>
              <p className="text-[11px] text-slate-400">10 kHz Physics-Guided Sensor Streamer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Active Status Ribbon */}
          <div className={`p-3 rounded-lg border flex items-center justify-between ${
            status?.isRunning
              ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
              : 'bg-surface/60 border-panel-border text-slate-400'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status?.isRunning ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="font-medium text-slate-200">
                {status?.isRunning
                  ? `Simulating ${status.scenario} on ${status.motorId}`
                  : 'Engine is idle'}
              </span>
            </div>
            {status?.isRunning && (
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-slate-400">{status.ticksEmitted} windows</span>
                <span className="text-amber-300 font-semibold">{status.currentTempC.toFixed(1)}°C</span>
              </div>
            )}
          </div>

          {/* Motor Target Selector */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
              Target Asset Replica
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['MOTOR-001', 'MOTOR-002'].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMotorId(id)}
                  className={`px-3 py-2 rounded-lg border text-left transition-all ${
                    motorId === id
                      ? 'bg-brand-600/10 border-brand-500/50 text-slate-100 font-medium'
                      : 'bg-surface/40 border-panel-border text-slate-400 hover:border-panel-border-strong hover:text-slate-300'
                  }`}
                >
                  <div className="font-mono text-xs text-slate-200">{id}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {id === 'MOTOR-001' ? 'Line A - Feed Pump' : 'Unit 2 - Cooling Fan'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Selector */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
              Fault Injection Mode
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {SCENARIOS.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => setScenario(sc.id)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    scenario === sc.id
                      ? 'bg-brand-600/10 border-brand-500/50 text-slate-100'
                      : 'bg-surface/30 border-panel-border text-slate-400 hover:bg-surface/60 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">{sc.name}</span>
                    <span className="font-mono text-[10px] text-brand-400 px-1.5 py-0.5 rounded bg-brand-950/40 border border-brand-800/40">
                      {sc.physics}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{sc.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Fault Severity & Load Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-surface/40 border border-panel-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-slate-300">Fault Severity</span>
                <span className="font-mono text-xs font-semibold text-brand-400">
                  {(severity * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={severity}
                onChange={(e) => setSeverity(parseFloat(e.target.value))}
                className="w-full accent-brand-500 cursor-pointer h-1.5 bg-panel-border rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>Incipient (10%)</span>
                <span>Critical (100%)</span>
              </div>
            </div>

            <div className="bg-surface/40 border border-panel-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-slate-300">Operating Load</span>
                <span className="font-mono text-xs font-semibold text-brand-400">
                  {loadPct}%
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 mt-1">
                {[25, 50, 75, 100].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLoadPct(l)}
                    className={`py-1 rounded font-mono text-[11px] border transition-colors ${
                      loadPct === l
                        ? 'bg-brand-600 text-white border-brand-500 font-semibold'
                        : 'bg-panel border-panel-border text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {l}%
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-slate-400 mt-1.5 text-center">
                Rated 3kW Shaft Load
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-panel-border bg-canvas-subtle flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400">
            Synthesizes 10,000 samples/sec
          </div>
          <div className="flex items-center gap-2">
            {status?.isRunning && (
              <button
                type="button"
                onClick={onStop}
                className="px-3.5 py-1.5 rounded-lg border border-rose-800/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/40 font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
              >
                <Square className="w-3 h-3" /> Stop Stream
              </button>
            )}
            <button
              type="button"
              onClick={handleStart}
              className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs inline-flex items-center gap-1.5 shadow-subtle transition-colors"
            >
              <Play className="w-3 h-3 fill-white" />
              {status?.isRunning ? 'Update & Re-inject' : 'Inject Telemetry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
