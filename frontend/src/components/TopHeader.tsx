import React from 'react';
import { Play, Square, Settings, Radio } from 'lucide-react';
import { SimulatorStatus } from '../types';

interface TopHeaderProps {
  breadcrumb: string;
  title: string;
  selectedMotorId: string;
  onSelectMotor: (id: string) => void;
  simulatorStatus?: SimulatorStatus;
  onOpenSimulator: () => void;
  onToggleSimulator: () => void;
  provenanceBadge?: string;
  actions?: React.ReactNode;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  breadcrumb,
  title,
  selectedMotorId,
  onSelectMotor,
  simulatorStatus,
  onOpenSimulator,
  onToggleSimulator,
  provenanceBadge = "Simulated Telemetry · IEEE Paper 3kW Spec",
  actions
}) => {
  const motors = ['MOTOR-001', 'MOTOR-002', 'MOTOR-003', 'MOTOR-004'];

  return (
    <header className="pb-5 mb-6 border-b border-rule">
      {/* Live status line */}
      <div className="flex items-center justify-between text-xs font-mono text-mute mb-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-rule bg-panel text-[11px] font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-ok" />
            {provenanceBadge}
          </span>
          {simulatorStatus?.isRunning && (
            <span className="inline-flex items-center gap-1 text-warn text-[11px] font-mono animate-pulse">
              <Radio className="w-3 h-3" />
              RUNNING: {simulatorStatus.scenario} ({simulatorStatus.severity * 100}% sev)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-ok animate-pulse-subtle" />
          <span>live · 1 s window (10 kHz)</span>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-mute font-mono uppercase tracking-wider mb-1">{breadcrumb}</div>
          <h1 className="text-3xl sm:text-4xl font-serif font-normal text-ink">{title}</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Motor Selector Pills */}
          <div className="inline-flex border border-rule rounded-full p-0.5 bg-panel">
            {motors.map((m) => (
              <button
                key={m}
                onClick={() => onSelectMotor(m)}
                className={`text-xs font-sans px-3 py-1 rounded-full transition-colors cursor-pointer ${
                  selectedMotorId === m
                    ? 'bg-ink text-bg font-medium shadow-sm'
                    : 'text-mute hover:text-ink'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Simulator Control */}
          <button
            onClick={onToggleSimulator}
            className={`inline-flex items-center gap-1.5 text-xs font-sans px-3 py-1.5 rounded-full border border-rule transition-colors cursor-pointer ${
              simulatorStatus?.isRunning
                ? 'bg-warn text-bg font-medium border-warn'
                : 'bg-panel text-ink hover:bg-track'
            }`}
          >
            {simulatorStatus?.isRunning ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                Stop Sim
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                Inject Fault
              </>
            )}
          </button>

          <button
            onClick={onOpenSimulator}
            title="Configure Simulator Parameters"
            className="p-1.5 rounded-full border border-rule bg-panel text-mute hover:text-ink hover:bg-track transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {actions}
        </div>
      </div>
    </header>
  );
};
