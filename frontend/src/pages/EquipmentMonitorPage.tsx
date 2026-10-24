import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { DigitalTwinState, TelemetryPoint } from '../types';
import { MotorSchematic, SENSORS } from '../components/equipment/MotorSchematic';
import { TelemetryChart } from '../components/telemetry/TelemetryChart';
import {
  Activity,
  Zap,
  Flame,
  Gauge,
  Disc,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Sliders,
} from 'lucide-react';

interface EquipmentMonitorPageProps {
  selectedMotorId: string;
  twins: DigitalTwinState[];
  onSelectMotor: (id: string) => void;
}

export const EquipmentMonitorPage: React.FC<EquipmentMonitorPageProps> = ({
  selectedMotorId,
  twins,
  onSelectMotor,
}) => {
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentTwin = twins.find((t) => t.motorId === selectedMotorId) || twins[0] || null;

  const loadTelemetry = useCallback(async () => {
    if (!currentTwin) return;
    try {
      const hist = await api.getTelemetryHistory(currentTwin.motorId, 30);
      setTelemetry(hist || []);
    } catch {
      // Backend busy
    }
  }, [currentTwin]);

  useEffect(() => {
    loadTelemetry();
    const interval = setInterval(loadTelemetry, 3000);
    return () => clearInterval(interval);
  }, [loadTelemetry]);

  const cfg = currentTwin?.configuration;
  const speed = currentTwin?.latestEstimatedSpeedRpm ?? cfg?.ratedSpeedRpm ?? 1440;
  const current = currentTwin?.latestCurrentRms ?? 5.8;
  const vib = currentTwin?.latestVibRms ?? 0.45;
  const kurtosis = currentTwin?.latestVibKurtosis ?? 0.05;
  const temp = currentTwin?.latestTemperatureC ?? 42.0;
  const load = currentTwin?.latestLoadPct ?? 100;
  const slip = ((1500 - speed) / 1500) * 100;

  // Selected sensor metadata
  const selectedSensor = SENSORS.find((s) => s.id === selectedSensorId);

  return (
    <div className="space-y-6 py-6">
      {/* Top Equipment Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-aerospace dark:text-aerospace-bright">
              EQUIPMENT ANALYTICAL MONITOR
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark text-ink-muted">
              IEC 60034-1 / IEEE 112
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink dark:text-ink-inverse mt-1">
            {currentTwin?.motorName || '3-Phase Induction Motor'}
          </h2>
          <p className="text-xs text-ink-secondary dark:text-ink-muted font-mono mt-0.5">
            Asset ID: {currentTwin?.motorId || 'MOTOR-001'} · Location: {cfg?.location || 'Manufacturing Plant - Line A'}
          </p>
        </div>

        {/* Equipment Selector Pill Tabs */}
        {twins.length > 1 && (
          <div className="flex items-center gap-1.5 bg-panel dark:bg-panel-dark p-1 rounded-lg border border-rule dark:border-rule-dark">
            {twins.map((t) => (
              <button
                key={t.motorId}
                type="button"
                onClick={() => onSelectMotor(t.motorId)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all ${
                  t.motorId === selectedMotorId
                    ? 'bg-aerospace text-white shadow-sm'
                    : 'text-ink-secondary dark:text-ink-muted hover:text-ink dark:hover:text-ink-inverse'
                }`}
              >
                {t.motorId}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nameplate Specifications Strip */}
      <div className="p-4 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-aerospace" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-ink-inverse">
            Rated Nameplate Specifications
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark">
            <span className="text-[10px] text-ink-muted block uppercase">Rated Power</span>
            <span className="font-bold text-ink dark:text-ink-inverse">{cfg?.ratedPowerKw?.toFixed(1) ?? '3.0'} kW</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark">
            <span className="text-[10px] text-ink-muted block uppercase">Supply Voltage</span>
            <span className="font-bold text-ink dark:text-ink-inverse">{cfg?.supplyVoltageV?.toFixed(0) ?? '415'} V (3Φ)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark">
            <span className="text-[10px] text-ink-muted block uppercase">Supply Freq</span>
            <span className="font-bold text-ink dark:text-ink-inverse">{cfg?.supplyFreqHz?.toFixed(0) ?? '50'} Hz</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark">
            <span className="text-[10px] text-ink-muted block uppercase">Poles / Synch</span>
            <span className="font-bold text-ink dark:text-ink-inverse">{cfg?.poles ?? '4'} Poles (1500 RPM)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark">
            <span className="text-[10px] text-ink-muted block uppercase">Rated Speed</span>
            <span className="font-bold text-ink dark:text-ink-inverse">{cfg?.ratedSpeedRpm?.toFixed(0) ?? '1440'} RPM</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark">
            <span className="text-[10px] text-ink-muted block uppercase">Insulation Class</span>
            <span className="font-bold text-ink dark:text-ink-inverse">Class F (155°C)</span>
          </div>
        </div>
      </div>

      {/* Interactive Motor Schematic with Sensor Pin Selection */}
      <div>
        <MotorSchematic
          twin={currentTwin}
          selectedSensorId={selectedSensorId}
          onSelectSensor={(id) => setSelectedSensorId(id)}
        />
        {selectedSensor && (
          <div className="mt-2 p-3 rounded-lg bg-aerospace/10 border border-aerospace/30 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-aerospace"></span>
              <span className="font-bold text-aerospace">
                Active Inspection Pin: {selectedSensor.id} ({selectedSensor.label})
              </span>
              <span className="text-ink-muted">· Location: {selectedSensor.location}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSensorId(null)}
              className="text-aerospace hover:underline"
            >
              Clear Focus
            </button>
          </div>
        )}
      </div>

      {/* Sensor Deep Dive Cards with Engineering Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Stator Current */}
        <div className="p-4 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-ink-muted">
            <span className="uppercase flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-telemetry-cyan" /> Stator Current RMS
            </span>
            <span>Sensor S3</span>
          </div>
          <div className="text-2xl font-mono font-bold text-ink dark:text-ink-inverse">
            {current.toFixed(2)} <span className="text-xs text-ink-muted font-normal">A</span>
          </div>
          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex justify-between text-ink-muted">
              <span>Rated Full Load (FLA):</span>
              <span className="font-semibold text-ink dark:text-ink-inverse">5.80 A</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Current Loading:</span>
              <span className={`font-semibold ${current > 6.0 ? 'text-state-warning' : 'text-state-normal'}`}>
                {((current / 5.8) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="w-full bg-surface-secondary dark:bg-panel-dark-subtle h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${current > 6.0 ? 'bg-state-warning' : 'bg-aerospace'}`}
              style={{ width: `${Math.min(100, (current / 7.0) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Radial Vibration RMS */}
        <div className="p-4 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-ink-muted">
            <span className="uppercase flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-state-warning" /> Radial Vibration
            </span>
            <span>Sensor S1/S4</span>
          </div>
          <div className="text-2xl font-mono font-bold text-ink dark:text-ink-inverse">
            {vib.toFixed(2)} <span className="text-xs text-ink-muted font-normal">mm/s RMS</span>
          </div>
          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex justify-between text-ink-muted">
              <span>ISO 10816 Zone A Limit:</span>
              <span className="font-semibold text-state-normal">&lt; 1.80 mm/s (Good)</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Kurtosis (Knock Sharpness):</span>
              <span className="font-semibold text-ink dark:text-ink-inverse">{kurtosis.toFixed(3)}</span>
            </div>
          </div>
          <div className="w-full bg-surface-secondary dark:bg-panel-dark-subtle h-2 rounded-full overflow-hidden flex">
            <div className="h-full bg-state-normal" style={{ width: '30%' }} title="Zone A: <1.8" />
            <div className="h-full bg-state-warning" style={{ width: '40%' }} title="Zone B/C: 1.8 - 4.5" />
            <div className="h-full bg-state-critical" style={{ width: '30%' }} title="Zone D: >4.5" />
          </div>
        </div>

        {/* Card 3: Winding Temperature */}
        <div className="p-4 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-ink-muted">
            <span className="uppercase flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-state-critical" /> Winding RTD Temp
            </span>
            <span>Sensor S2</span>
          </div>
          <div className="text-2xl font-mono font-bold text-ink dark:text-ink-inverse">
            {temp.toFixed(1)} <span className="text-xs text-ink-muted font-normal">°C</span>
          </div>
          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex justify-between text-ink-muted">
              <span>Class F Rise Limit:</span>
              <span className="font-semibold text-ink dark:text-ink-inverse">105°C rise (145°C max)</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Thermal Margin:</span>
              <span className="font-semibold text-state-normal">{(145 - temp).toFixed(1)}°C remaining</span>
            </div>
          </div>
          <div className="w-full bg-surface-secondary dark:bg-panel-dark-subtle h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${temp > 90 ? 'bg-state-critical' : temp > 70 ? 'bg-state-warning' : 'bg-state-normal'}`}
              style={{ width: `${Math.min(100, (temp / 145) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Shaft Speed & Slip */}
        <div className="p-4 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-ink-muted">
            <span className="uppercase flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-aerospace" /> Speed & Slip
            </span>
            <span>Sensor S5</span>
          </div>
          <div className="text-2xl font-mono font-bold text-ink dark:text-ink-inverse">
            {Math.round(speed)} <span className="text-xs text-ink-muted font-normal">RPM</span>
          </div>
          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex justify-between text-ink-muted">
              <span>Synchronous Speed:</span>
              <span className="font-semibold text-ink dark:text-ink-inverse">1500 RPM (50Hz / 4P)</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Calculated Slip ($s$):</span>
              <span className="font-semibold text-ink dark:text-ink-inverse">{slip.toFixed(2)}%</span>
            </div>
          </div>
          <div className="w-full bg-surface-secondary dark:bg-panel-dark-subtle h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-telemetry-cyan"
              style={{ width: `${Math.min(100, (speed / 1500) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Historical Telemetry Chart */}
      <TelemetryChart telemetry={telemetry} loading={loading} />

      {/* Raw Telemetry Records Ingestion Table */}
      <div className="p-4 sm:p-5 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-aerospace" />
            <h3 className="text-sm font-semibold text-ink dark:text-ink-inverse">
              Authoritative Telemetry Ingestion Log
            </h3>
          </div>
          <span className="text-xs font-mono text-ink-muted">
            {telemetry.length} Buffered Windows
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-rule dark:border-rule-dark text-ink-muted text-[10px] uppercase">
                <th className="py-2 px-3">Timestamp (UTC)</th>
                <th className="py-2 px-3">Current RMS (A)</th>
                <th className="py-2 px-3">Fundamental (A)</th>
                <th className="py-2 px-3">Vib RMS (mm/s)</th>
                <th className="py-2 px-3">Vib Kurtosis</th>
                <th className="py-2 px-3">Temp (°C)</th>
                <th className="py-2 px-3">Load (%)</th>
                <th className="py-2 px-3">Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule/60 dark:divide-rule-dark/60 text-ink dark:text-ink-inverse">
              {telemetry.slice(0, 8).map((pt, i) => (
                <tr key={pt.id || i} className="hover:bg-surface-secondary/50 dark:hover:bg-panel-dark-subtle">
                  <td className="py-2 px-3 text-ink-muted">
                    {new Date(pt.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2 px-3 font-semibold">{pt.currentRms?.toFixed(3) ?? '–'}</td>
                  <td className="py-2 px-3">{pt.fundamentalAmp?.toFixed(3) ?? '–'}</td>
                  <td className="py-2 px-3 font-semibold">{pt.vibRms?.toFixed(3) ?? '–'}</td>
                  <td className="py-2 px-3">{pt.vibKurtosis?.toFixed(3) ?? '–'}</td>
                  <td className="py-2 px-3">{pt.temperatureC?.toFixed(1) ?? '–'}</td>
                  <td className="py-2 px-3">{pt.loadPct?.toFixed(0) ?? '–'}%</td>
                  <td className="py-2 px-3 text-ink-muted text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark">
                      {pt.provenance || 'Simulation'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
