import React, { useState } from 'react';
import {
  Zap,
  Waves,
  Thermometer,
  Gauge,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Wrench,
  SlidersHorizontal
} from 'lucide-react';
import { DigitalTwinState } from '../types';

interface EquipmentSchematicProps {
  twin?: DigitalTwinState;
  onOpenSimulator: () => void;
}

type ComponentKey = 'STATOR' | 'ROTOR' | 'BEARINGS' | 'AIRGAP' | 'COOLING';

interface ComponentDetail {
  title: string;
  category: string;
  description: string;
  sensorReadings: { label: string; value: string; status: 'NORMAL' | 'WARNING' | 'CRITICAL' }[];
  vulnerability: string;
  governingStandard: string;
}

export const EquipmentSchematic: React.FC<EquipmentSchematicProps> = ({ twin, onOpenSimulator }) => {
  const [selectedComponent, setSelectedComponent] = useState<ComponentKey>('ROTOR');

  const componentsData: Record<ComponentKey, ComponentDetail> = {
    STATOR: {
      title: 'Stator Core & 3-Phase Copper Windings',
      category: 'Electrical Subsystem',
      description: 'Laminated silicon steel stator teeth supporting form-wound insulated copper coils connected to 415V 50Hz three-phase supply.',
      sensorReadings: [
        { label: 'Phase RMS Current', value: `${(twin?.latestCurrentRms || 5.8).toFixed(2)} A`, status: 'NORMAL' },
        { label: '3rd Harmonic (150 Hz)', value: '0.018 (% fs)', status: twin?.predictedFaultClass === 'STATOR_INTER_TURN_SHORT' ? 'CRITICAL' : 'NORMAL' },
        { label: 'Stator Casing Temp', value: `${(twin?.latestTemperatureC || 42.0).toFixed(1)} °C`, status: (twin?.latestTemperatureC || 42) > 60 ? 'WARNING' : 'NORMAL' }
      ],
      vulnerability: 'Inter-turn enamel degradation causing circulating fault currents and localized thermal hotspots.',
      governingStandard: 'IEEE 522 Guide for Testing Turn Insulation of Form-Wound Stator Coils'
    },
    ROTOR: {
      title: 'Squirrel-Cage Rotor & End Rings',
      category: 'Electromechanical Subsystem',
      description: 'Die-cast conductive rotor bars short-circuited at both ends by heavy conductive end rings, operating at ~1440 RPM with 4% slip.',
      sensorReadings: [
        { label: 'Operating Slip', value: 's = 0.04 (4%)', status: 'NORMAL' },
        { label: 'BRB Sideband Ratio', value: 'f_br = fs(1 ± 2s)', status: twin?.predictedFaultClass === 'BROKEN_ROTOR_BAR' ? 'CRITICAL' : 'NORMAL' },
        { label: 'Shaft Speed', value: `${(twin?.latestEstimatedSpeedRpm || 1440).toFixed(0)} RPM`, status: 'NORMAL' }
      ],
      vulnerability: 'Fatigue cracking in rotor bar joints due to repeated thermal expansion and direct-on-line starting torques.',
      governingStandard: 'IEEE 1415 Guide for Induction Machinery Maintenance'
    },
    BEARINGS: {
      title: 'Deep-Groove Ball Bearings (6205 DE / NDE)',
      category: 'Mechanical Support Subsystem',
      description: 'Precision rolling element bearings supporting the rotor shaft within the motor end bells, absorbing radial and residual axial loads.',
      sensorReadings: [
        { label: 'Radial Vibration RMS', value: `${(twin?.latestVibRms || 0.28).toFixed(2)} mm/s`, status: (twin?.latestVibRms || 0.28) > 1.2 ? 'CRITICAL' : 'NORMAL' },
        { label: 'Vibration Kurtosis', value: `${(twin?.latestVibKurtosis || 2.8).toFixed(2)}`, status: (twin?.latestVibKurtosis || 2.8) > 3.5 ? 'WARNING' : 'NORMAL' },
        { label: 'BPFO Spectral Energy', value: '~80.5 Hz Peak', status: twin?.predictedFaultClass === 'BEARING_DEFECT' ? 'CRITICAL' : 'NORMAL' }
      ],
      vulnerability: 'Raceway flaking, spalling, and dry lubrication causing high-frequency impulsive shock pulses.',
      governingStandard: 'ISO 10816-3 Mechanical Vibration Class I Limits'
    },
    AIRGAP: {
      title: 'Radial Air-Gap & Rotor Shaft Assembly',
      category: 'Magnetic Coupling Subsystem',
      description: 'Uniform 0.5 mm magnetic air gap separating the stationary stator core from the rotating rotor surface.',
      sensorReadings: [
        { label: '1x Shaft Vibration', value: '24.0 Hz Harmonic', status: twin?.predictedFaultClass === 'AIR_GAP_ECCENTRICITY' ? 'WARNING' : 'NORMAL' },
        { label: 'Radial Eccentricity', value: '<0.05 mm', status: 'NORMAL' },
        { label: 'Supply Line Frequency', value: '50.0 Hz', status: 'NORMAL' }
      ],
      vulnerability: 'Static or dynamic eccentricity from bent shaft or misaligned end bells modulating magnetic air-gap permeance.',
      governingStandard: 'NEMA MG-1 Motors and Generators Standards'
    },
    COOLING: {
      title: 'Shaft-Mounted Cooling Fan & Casing Ribs',
      category: 'Thermal Dissipation Subsystem',
      description: 'Bi-directional radial cooling fan driven by the rotor shaft forcing ambient air across external cast-iron casing cooling fins.',
      sensorReadings: [
        { label: 'Casing Temperature', value: `${(twin?.latestTemperatureC || 42.0).toFixed(1)} °C`, status: 'NORMAL' },
        { label: 'Rate of Temperature Rise', value: '0.12 °C/min', status: 'NORMAL' },
        { label: 'Cooling Mode', value: 'TEFC (Fan Cooled)', status: 'NORMAL' }
      ],
      vulnerability: 'Finned duct clogging or ambient dust accumulation inhibiting convective thermal transfer.',
      governingStandard: 'IEC 60034-6 Methods of Cooling (IC Codes)'
    }
  };

  const active = componentsData[selectedComponent];

  return (
    <div className="bg-panel border border-panel-border rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-panel-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-100">
              Interactive Digital Twin Machine Schematic
            </h2>
            <span className="font-mono text-[10px] text-brand-400 px-1.5 py-0.5 rounded bg-brand-950/40 border border-brand-800/40">
              IEEE 3-Phase 3kW
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any subsystem in the cutaway diagram to inspect localized sensor telemetry and failure vulnerabilities.
          </p>
        </div>

        <button
          onClick={onOpenSimulator}
          className="px-3 py-1.5 rounded bg-surface hover:bg-surface-elevated text-slate-200 border border-panel-border text-xs font-medium inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-brand-400" />
          <span>Inject Simulated Fault</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
        {/* SVG Machine Cutaway Schematic */}
        <div className="lg:col-span-7 bg-canvas-subtle border border-panel-border/80 rounded-lg p-4 flex flex-col items-center justify-center">
          <svg
            viewBox="0 0 600 320"
            className="w-full h-auto max-h-72 select-none"
          >
            <defs>
              <linearGradient id="casingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="statorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d97706" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#b45309" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="rotorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Base Mounting Feet */}
            <rect x="120" y="260" width="80" height="25" rx="3" fill="#334155" />
            <rect x="360" y="260" width="80" height="25" rx="3" fill="#334155" />
            <rect x="100" y="280" width="360" height="12" rx="2" fill="#1e293b" />

            {/* Main Outer Casing & Cooling Fins */}
            <g
              onClick={() => setSelectedComponent('COOLING')}
              className="cursor-pointer group"
            >
              <rect
                x="140"
                y="50"
                width="280"
                height="210"
                rx="12"
                fill="url(#casingGrad)"
                stroke={selectedComponent === 'COOLING' ? '#38bdf8' : '#334155'}
                strokeWidth={selectedComponent === 'COOLING' ? '2.5' : '1.5'}
              />
              {/* Cooling Ribs */}
              {[70, 95, 120, 145, 170, 195, 220].map((y) => (
                <line
                  key={y}
                  x1="140"
                  y1={y}
                  x2="420"
                  y2={y}
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              ))}
              <text x="280" y="42" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="sans-serif">
                External TEFC Casing Fins
              </text>
            </g>

            {/* Stator Windings (Upper & Lower) */}
            <g
              onClick={() => setSelectedComponent('STATOR')}
              className="cursor-pointer"
            >
              <rect
                x="180"
                y="75"
                width="200"
                height="45"
                rx="4"
                fill="url(#statorGrad)"
                stroke={selectedComponent === 'STATOR' ? '#f59e0b' : '#b45309'}
                strokeWidth={selectedComponent === 'STATOR' ? '2.5' : '1'}
              />
              <rect
                x="180"
                y="190"
                width="200"
                height="45"
                rx="4"
                fill="url(#statorGrad)"
                stroke={selectedComponent === 'STATOR' ? '#f59e0b' : '#b45309'}
                strokeWidth={selectedComponent === 'STATOR' ? '2.5' : '1'}
              />
              <text x="280" y="103" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="600" fontFamily="sans-serif">
                3-Phase Stator Windings (415V)
              </text>
            </g>

            {/* Magnetic Air-Gap Lines */}
            <g
              onClick={() => setSelectedComponent('AIRGAP')}
              className="cursor-pointer"
            >
              <line x1="180" y1="123" x2="380" y2="123" stroke={selectedComponent === 'AIRGAP' ? '#a855f7' : '#475569'} strokeWidth="2" strokeDasharray="3 3" />
              <line x1="180" y1="187" x2="380" y2="187" stroke={selectedComponent === 'AIRGAP' ? '#a855f7' : '#475569'} strokeWidth="2" strokeDasharray="3 3" />
            </g>

            {/* Squirrel-Cage Rotor Core */}
            <g
              onClick={() => setSelectedComponent('ROTOR')}
              className="cursor-pointer"
            >
              <rect
                x="195"
                y="126"
                width="170"
                height="58"
                rx="4"
                fill="url(#rotorGrad)"
                stroke={selectedComponent === 'ROTOR' ? '#38bdf8' : '#0284c7'}
                strokeWidth={selectedComponent === 'ROTOR' ? '2.5' : '1'}
              />
              {/* Rotor Conductive Bars */}
              {[210, 230, 250, 270, 290, 310, 330, 350].map((x) => (
                <line
                  key={x}
                  x1={x}
                  y1="126"
                  x2={x + 10}
                  y2="184"
                  stroke="#7dd3fc"
                  strokeWidth="2"
                  strokeOpacity="0.8"
                />
              ))}
              <text x="280" y="159" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                Squirrel-Cage Rotor (s=0.04)
              </text>
            </g>

            {/* Center Rotor Shaft */}
            <rect x="40" y="148" width="520" height="14" rx="2" fill="#94a3b8" stroke="#475569" />

            {/* Bearings (Drive End & Non-Drive End) */}
            <g
              onClick={() => setSelectedComponent('BEARINGS')}
              className="cursor-pointer"
            >
              {/* DE Bearing */}
              <rect
                x="415"
                y="135"
                width="25"
                height="40"
                rx="3"
                fill="#ec4899"
                fillOpacity="0.25"
                stroke={selectedComponent === 'BEARINGS' ? '#ec4899' : '#db2777'}
                strokeWidth={selectedComponent === 'BEARINGS' ? '2.5' : '1.5'}
              />
              <circle cx="427" cy="145" r="3.5" fill="#fbcfe8" />
              <circle cx="427" cy="165" r="3.5" fill="#fbcfe8" />

              {/* NDE Bearing */}
              <rect
                x="120"
                y="135"
                width="25"
                height="40"
                rx="3"
                fill="#ec4899"
                fillOpacity="0.25"
                stroke={selectedComponent === 'BEARINGS' ? '#ec4899' : '#db2777'}
                strokeWidth={selectedComponent === 'BEARINGS' ? '2.5' : '1.5'}
              />
              <circle cx="132" cy="145" r="3.5" fill="#fbcfe8" />
              <circle cx="132" cy="165" r="3.5" fill="#fbcfe8" />

              <text x="427" y="195" textAnchor="middle" fill="#f472b6" fontSize="9" fontWeight="600" fontFamily="sans-serif">
                DE Bearing
              </text>
              <text x="132" y="195" textAnchor="middle" fill="#f472b6" fontSize="9" fontWeight="600" fontFamily="sans-serif">
                NDE Bearing
              </text>
            </g>

            {/* Cooling Fan on NDE */}
            <g
              onClick={() => setSelectedComponent('COOLING')}
              className="cursor-pointer"
            >
              <path
                d="M 75 110 L 105 110 L 100 200 L 70 200 Z"
                fill="#475569"
                stroke={selectedComponent === 'COOLING' ? '#38bdf8' : '#334155'}
                strokeWidth="1.5"
              />
              <text x="88" y="218" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
                Fan
              </text>
            </g>
          </svg>

          {/* Quick Subsystem Select Buttons */}
          <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
            {(['ROTOR', 'STATOR', 'BEARINGS', 'AIRGAP', 'COOLING'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedComponent(key)}
                className={`px-2 py-1 rounded font-mono text-[10px] transition-colors ${
                  selectedComponent === key
                    ? 'bg-brand-600 text-white font-semibold shadow-subtle'
                    : 'bg-surface text-slate-400 hover:text-slate-200'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Component Condition Detail Panel */}
        <div className="lg:col-span-5 bg-surface/30 border border-panel-border/80 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-mono text-[10px] uppercase text-brand-400">{active.category}</span>
              <span className="text-[10px] font-mono text-slate-500">Subsystem Spec</span>
            </div>
            <h3 className="font-bold text-slate-100 text-base">{active.title}</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {active.description}
            </p>

            {/* Sensor Telemetry Readings */}
            <div className="mt-4 space-y-2">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                Active Telemetry Channel
              </div>
              {active.sensorReadings.map((reading, idx) => (
                <div
                  key={idx}
                  className="bg-panel border border-panel-border/60 rounded px-3 py-2 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-300">{reading.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-100">{reading.value}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      reading.status === 'CRITICAL' ? 'bg-rose-500 animate-pulse' :
                      reading.status === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Physical Vulnerability */}
            <div className="mt-4 pt-3 border-t border-panel-border/60 text-xs">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
                Dominant Failure Vulnerability
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {active.vulnerability}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-panel-border/60 text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>Standard:</span>
            <span className="text-slate-300 truncate max-w-[200px]" title={active.governingStandard}>
              {active.governingStandard}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
