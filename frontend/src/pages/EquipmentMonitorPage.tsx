import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { DigitalTwinState, TelemetryPoint } from '../types';
import { MotorSchematic, SENSORS } from '../components/equipment/MotorSchematic';
import { TelemetryChart, SignalKey } from '../components/telemetry/TelemetryChart';
import {
  Activity,
  Zap,
  Flame,
  Gauge,
  Disc,
  Info,
  Layers,
  Crosshair,
  Radio,
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
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>('S1');
  const [activeSignal, setActiveSignal] = useState<SignalKey>('vibRms');
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
    const interval = setInterval(loadTelemetry, 2000);
    return () => clearInterval(interval);
  }, [loadTelemetry]);

  const cfg = currentTwin?.configuration;
  const speed = currentTwin?.latestEstimatedSpeedRpm ?? cfg?.ratedSpeedRpm ?? 1440;
  const current = currentTwin?.latestCurrentRms ?? 5.8;
  const vib = currentTwin?.latestVibRms ?? 0.45;
  const kurtosis = currentTwin?.latestVibKurtosis ?? 0.05;
  const temp = currentTwin?.latestTemperatureC ?? 42.0;
  const load = currentTwin?.latestLoadPct ?? 100;
  const slip = Math.max(0, ((1500 - speed) / 1500) * 100);

  // Selected sensor metadata
  const selectedSensor = SENSORS.find((s) => s.id === selectedSensorId);

  const handleSelectSensor = (sensorId: string | null) => {
    setSelectedSensorId(sensorId);
    if (!sensorId) return;
    if (sensorId === 'S1' || sensorId === 'S4') setActiveSignal('vibRms');
    else if (sensorId === 'S2') setActiveSignal('temperatureC');
    else if (sensorId === 'S3') setActiveSignal('currentRms');
    else if (sensorId === 'S5') setActiveSignal('speed');
  };

  const handleSignalChange = (key: SignalKey) => {
    setActiveSignal(key);
    if (key === 'vibRms') setSelectedSensorId('S1');
    else if (key === 'currentRms') setSelectedSensorId('S3');
    else if (key === 'temperatureC') setSelectedSensorId('S2');
    else if (key === 'speed') setSelectedSensorId('S5');
    else if (key === 'loadPct') setSelectedSensorId(null);
  };

  return (
    <div className="space-y-4 py-4">
      {/* Top Equipment Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Digital Twins — Equipment Monitor
            </h2>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#0B202C] text-[#27866F] border border-[#1C3B4E] flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              SIMULATED TELEMETRY
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
            Asset: {currentTwin?.motorId || 'MOTOR-001'} · {currentTwin?.motorName || '3-Phase Induction Motor'} · Simulation Mode (IEEE 112 3kW Spec)
          </p>
        </div>

        {/* Equipment Selector Pill Tabs */}
        {twins.length > 1 && (
          <div className="flex items-center gap-1.5 bg-[#0B202C] p-1 rounded border border-[#1C3B4E]">
            <span className="text-[10px] font-mono text-[#718096] uppercase px-1">Unit:</span>
            {twins.map((t) => (
              <button
                key={t.motorId}
                type="button"
                onClick={() => onSelectMotor(t.motorId)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                  t.motorId === selectedMotorId
                    ? 'bg-[#68409A] text-white shadow-xs'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#102A38]'
                }`}
              >
                {t.motorId}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nameplate Specifications Strip */}
      <div className="rounded-md bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="h-9 px-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-[#355D8B]" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#253746]">
              Nameplate Rated Parameters (IEC 60034-1 / IEEE 112)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#718096]">
            3-Phase Squirrel Cage Design B
          </span>
        </div>

        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-mono">
          <div className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[9px] text-[#718096] block uppercase">Rated Power</span>
            <span className="font-bold text-[#253746] mt-0.5 block">{cfg?.ratedPowerKw?.toFixed(1) ?? '3.0'} kW</span>
          </div>
          <div className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[9px] text-[#718096] block uppercase">Supply Voltage</span>
            <span className="font-bold text-[#253746] mt-0.5 block">{cfg?.supplyVoltageV?.toFixed(0) ?? '415'} V (3Φ)</span>
          </div>
          <div className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[9px] text-[#718096] block uppercase">Supply Freq</span>
            <span className="font-bold text-[#253746] mt-0.5 block">{cfg?.supplyFreqHz?.toFixed(0) ?? '50'} Hz</span>
          </div>
          <div className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[9px] text-[#718096] block uppercase">Poles / Synch</span>
            <span className="font-bold text-[#253746] mt-0.5 block">{cfg?.poles ?? '4'} Poles (1500 RPM)</span>
          </div>
          <div className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[9px] text-[#718096] block uppercase">Rated Speed</span>
            <span className="font-bold text-[#253746] mt-0.5 block">{cfg?.ratedSpeedRpm?.toFixed(0) ?? '1440'} RPM</span>
          </div>
          <div className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[9px] text-[#718096] block uppercase">Insulation Class</span>
            <span className="font-bold text-[#253746] mt-0.5 block">Class F (155°C)</span>
          </div>
        </div>
      </div>

      {/* Cyber-Physical Motor Schematic */}
      <div className="rounded-md bg-white border border-[#E2E8F0] shadow-sm overflow-hidden p-3.5">
        <MotorSchematic
          twin={currentTwin}
          selectedSensorId={selectedSensorId}
          onSelectSensor={handleSelectSensor}
        />
        {selectedSensor && (
          <div className="mt-2.5 p-2 rounded bg-[#F3EBF9] border border-[#68409A]/30 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-[#68409A]" />
              <span className="font-bold text-[#68409A]">
                Pin {selectedSensor.id}: {selectedSensor.label}
              </span>
              <span className="text-[#718096]">· Location: {selectedSensor.location}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSensorId(null)}
              className="text-[#68409A] hover:underline text-[11px]"
            >
              Clear Focus
            </button>
          </div>
        )}
      </div>

      {/* Sensor Deep Dive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Stator Current */}
        <div
          onClick={() => handleSelectSensor('S3')}
          className={`p-3.5 rounded-md bg-white border transition-all cursor-pointer space-y-2 shadow-sm ${
            selectedSensorId === 'S3'
              ? 'border-[#355D8B] ring-2 ring-[#355D8B]/20'
              : 'border-[#E2E8F0] hover:border-[#355D8B]/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#718096]">
            <span className="uppercase flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#355D8B]" /> Current RMS
            </span>
            <span className={selectedSensorId === 'S3' ? 'text-[#355D8B] font-bold' : ''}>Pin S3</span>
          </div>
          <div className="text-2xl font-mono font-bold text-[#253746]">
            {current.toFixed(2)} <span className="text-xs text-[#718096] font-normal">A</span>
          </div>
          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex justify-between text-[#718096]">
              <span>Rated FLA:</span>
              <span className="font-semibold text-[#253746]">5.80 A</span>
            </div>
            <div className="flex justify-between text-[#718096]">
              <span>Current Loading:</span>
              <span className={`font-semibold ${current > 6.0 ? 'text-[#D99A35]' : 'text-[#27866F]'}`}>
                {((current / 5.8) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${current > 6.0 ? 'bg-[#D99A35]' : 'bg-[#355D8B]'}`}
              style={{ width: `${Math.min(100, (current / 7.0) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Radial Vibration RMS */}
        <div
          onClick={() => handleSelectSensor('S1')}
          className={`p-3.5 rounded-md bg-white border transition-all cursor-pointer space-y-2 shadow-sm ${
            selectedSensorId === 'S1' || selectedSensorId === 'S4'
              ? 'border-[#D99A35] ring-2 ring-[#D99A35]/20'
              : 'border-[#E2E8F0] hover:border-[#D99A35]/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#718096]">
            <span className="uppercase flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#D99A35]" /> Radial Vibration
            </span>
            <span className={selectedSensorId === 'S1' || selectedSensorId === 'S4' ? 'text-[#D99A35] font-bold' : ''}>
              Pin S1/S4
            </span>
          </div>
          <div className="text-2xl font-mono font-bold text-[#253746]">
            {vib.toFixed(2)} <span className="text-xs text-[#718096] font-normal">mm/s RMS</span>
          </div>
          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex justify-between text-[#718096]">
              <span>ISO 10816 Limit:</span>
              <span className="font-semibold text-[#253746]">1.80 mm/s</span>
            </div>
            <div className="flex justify-between text-[#718096]">
              <span>Kurtosis:</span>
              <span className="font-semibold text-[#253746]">{kurtosis.toFixed(2)}</span>
            </div>
          </div>
          <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${vib > 1.8 ? 'bg-[#C94B50]' : vib > 1.0 ? 'bg-[#D99A35]' : 'bg-[#27866F]'}`}
              style={{ width: `${Math.min(100, (vib / 2.5) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Stator Temperature */}
        <div
          onClick={() => handleSelectSensor('S2')}
          className={`p-3.5 rounded-md bg-white border transition-all cursor-pointer space-y-2 shadow-sm ${
            selectedSensorId === 'S2'
              ? 'border-[#C94B50] ring-2 ring-[#C94B50]/20'
              : 'border-[#E2E8F0] hover:border-[#C94B50]/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#718096]">
            <span className="uppercase flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#C94B50]" /> Winding Temp
            </span>
            <span className={selectedSensorId === 'S2' ? 'text-[#C94B50] font-bold' : ''}>Pin S2 (PT100)</span>
          </div>
          <div className="text-2xl font-mono font-bold text-[#253746]">
            {temp.toFixed(1)} <span className="text-xs text-[#718096] font-normal">°C</span>
          </div>
          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex justify-between text-[#718096]">
              <span>Warning Threshold:</span>
              <span className="font-semibold text-[#253746]">80.0 °C</span>
            </div>
            <div className="flex justify-between text-[#718096]">
              <span>Class F Max:</span>
              <span className="font-semibold text-[#253746]">155.0 °C</span>
            </div>
          </div>
          <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${temp > 80 ? 'bg-[#C94B50]' : temp > 60 ? 'bg-[#D99A35]' : 'bg-[#27866F]'}`}
              style={{ width: `${Math.min(100, (temp / 100) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Rotational Speed & Slip */}
        <div
          onClick={() => handleSelectSensor('S5')}
          className={`p-3.5 rounded-md bg-white border transition-all cursor-pointer space-y-2 shadow-sm ${
            selectedSensorId === 'S5'
              ? 'border-[#68409A] ring-2 ring-[#68409A]/20'
              : 'border-[#E2E8F0] hover:border-[#68409A]/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#718096]">
            <span className="uppercase flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#68409A]" /> Shaft Speed
            </span>
            <span className={selectedSensorId === 'S5' ? 'text-[#68409A] font-bold' : ''}>Pin S5 (Encoder)</span>
          </div>
          <div className="text-2xl font-mono font-bold text-[#253746]">
            {speed} <span className="text-xs text-[#718096] font-normal">RPM</span>
          </div>
          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex justify-between text-[#718096]">
              <span>Synchronous:</span>
              <span className="font-semibold text-[#253746]">1500 RPM</span>
            </div>
            <div className="flex justify-between text-[#718096]">
              <span>Calculated Slip:</span>
              <span className="font-semibold text-[#253746]">{slip.toFixed(2)}%</span>
            </div>
          </div>
          <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#68409A]"
              style={{ width: `${Math.min(100, (speed / 1500) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Telemetry Stream Chart */}
      <TelemetryChart
        telemetry={telemetry}
        loading={loading}
        activeSignal={activeSignal}
        onSignalChange={handleSignalChange}
      />
    </div>
  );
};
