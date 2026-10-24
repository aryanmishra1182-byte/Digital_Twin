import React, { useState } from 'react';
import { DigitalTwinState } from '../../types';
import { Zap, Gauge, Flame, Activity, Disc, Crosshair } from 'lucide-react';

export interface SensorPoint {
  id: string;
  label: string;
  location: string;
  x: number; // percentage in SVG viewBox
  y: number;
  type: 'current' | 'vibration' | 'temperature' | 'speed';
  unit: string;
}

interface MotorSchematicProps {
  twin?: DigitalTwinState | null;
  selectedSensorId?: string | null;
  onSelectSensor?: (sensorId: string | null) => void;
  interactive?: boolean;
}

export const SENSORS: SensorPoint[] = [
  { id: 'S1', label: 'DE Bearing Vib', location: 'Drive-End Bearing Radial', x: 23, y: 50, type: 'vibration', unit: 'mm/s' },
  { id: 'S2', label: 'Winding RTD', location: 'Stator Phase Winding Core', x: 50, y: 22, type: 'temperature', unit: '°C' },
  { id: 'S3', label: 'Current CTs', location: '3-Phase Stator Feeder Terminals', x: 74, y: 22, type: 'current', unit: 'A' },
  { id: 'S4', label: 'NDE Bearing Vib', location: 'Non-Drive-End Bearing Radial', x: 80, y: 50, type: 'vibration', unit: 'mm/s' },
  { id: 'S5', label: 'Shaft Encoder', location: 'Shaft Extension Output', x: 12, y: 50, type: 'speed', unit: 'RPM' },
];

export const MotorSchematic: React.FC<MotorSchematicProps> = ({
  twin,
  selectedSensorId,
  onSelectSensor,
  interactive = true,
}) => {
  const [hoveredSensor, setHoveredSensor] = useState<string | null>(null);

  const state = twin?.operationalState || 'HEALTHY';
  const faultClass = twin?.predictedFaultClass || 'HEALTHY';
  const isCritical = state === 'CRITICAL';
  const isWarning = state === 'WARNING';

  // Get current readings from twin or standard rated fallbacks
  const speed = twin?.latestEstimatedSpeedRpm ?? twin?.configuration?.ratedSpeedRpm ?? 1440;
  const temp = twin?.latestTemperatureC ?? 42;
  const vib = twin?.latestVibRms ?? 0.45;
  const current = twin?.latestCurrentRms ?? 5.8;
  const load = twin?.latestLoadPct ?? 100;

  // Sensor value helper
  const getSensorValue = (sensorId: string) => {
    switch (sensorId) {
      case 'S1':
      case 'S4':
        return `${vib.toFixed(2)} mm/s`;
      case 'S2':
        return `${temp.toFixed(1)} °C`;
      case 'S3':
        return `${current.toFixed(2)} A`;
      case 'S5':
        return `${Math.round(speed)} RPM`;
      default:
        return '–';
    }
  };

  // Determine which components to highlight based on predicted fault
  const isRotorFault = faultClass === 'BROKEN_ROTOR_BAR';
  const isStatorFault = faultClass === 'STATOR_INTER_TURN_SHORT';
  const isBearingFault = faultClass === 'BEARING_DEFECT';
  const isEccentricityFault = faultClass === 'AIR_GAP_ECCENTRICITY';

  // State styling tokens
  const stateColor = isCritical
    ? '#D74444'
    : isWarning
    ? '#D58B22'
    : '#16856B';

  return (
    <div className="relative w-full rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark p-4 sm:p-6 overflow-hidden flex flex-col justify-between select-none">
      {/* Top Header Row of the Schematic */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-aerospace dark:text-aerospace-bright">
              CYBER-PHYSICAL TWIN SCHEMATIC
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                isCritical
                  ? 'bg-state-critical/15 text-state-critical border border-state-critical/30'
                  : isWarning
                  ? 'bg-state-warning/15 text-state-warning border border-state-warning/30'
                  : 'bg-state-normal/15 text-state-normal border border-state-normal/30'
              }`}
            >
              {state}
            </span>
          </div>
          <h2 className="text-base font-semibold text-ink dark:text-ink-inverse mt-0.5">
            {twin?.motorName || '3-Phase Induction Motor (415V, 3.0 kW)'}
          </h2>
          <p className="text-xs text-ink-secondary dark:text-ink-muted font-mono">
            ID: {twin?.motorId || 'MOTOR-001'} · Speed: {Math.round(speed)} RPM · Rated: 3.0 kW
          </p>
        </div>

        {/* Diagnostic Status Indicator */}
        <div className="flex items-center gap-2">
          {faultClass !== 'HEALTHY' && (
            <div className="px-3 py-1 rounded-lg bg-state-critical/10 border border-state-critical/30 flex items-center gap-2 text-xs font-mono text-state-critical">
              <span className="w-2 h-2 rounded-full bg-state-critical animate-ping"></span>
              <span className="font-bold">FAULT DETECTED: {faultClass.replace(/_/g, ' ')}</span>
            </div>
          )}
          {faultClass === 'HEALTHY' && (
            <div className="px-3 py-1 rounded-lg bg-state-normal/10 border border-state-normal/30 flex items-center gap-2 text-xs font-mono text-state-normal">
              <span className="w-2 h-2 rounded-full bg-state-normal"></span>
              <span>SYMMETRICAL AIR-GAP & WINDINGS</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full aspect-[16/8] min-h-[260px] max-h-[420px] flex items-center justify-center">
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full drop-shadow-sm"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Interactive 3-Phase Induction Motor Cross-Section Schematic"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="casingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2A384C" />
              <stop offset="50%" stopColor="#1B2636" />
              <stop offset="100%" stopColor="#121B27" />
            </linearGradient>

            <linearGradient id="shaftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="50%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>

            <linearGradient id="rotorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="windingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.9" />
            </linearGradient>

            <radialGradient id="faultGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </radialGradient>

            {/* Rotor bar pattern */}
            <pattern id="rotorBars" width="20" height="20" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="20" stroke="#60A5FA" strokeWidth="2.5" opacity="0.6" />
            </pattern>
          </defs>

          {/* Background Grid Lines (Engineering Blueprint feel) */}
          <g opacity="0.1" stroke="currentColor">
            <line x1="100" y1="250" x2="900" y2="250" strokeDasharray="6 4" strokeWidth="1" />
            <line x1="500" y1="80" x2="500" y2="420" strokeDasharray="6 4" strokeWidth="1" />
            <circle cx="500" cy="250" r="180" fill="none" strokeWidth="0.5" />
            <circle cx="500" cy="250" r="120" fill="none" strokeWidth="0.5" />
          </g>

          {/* Central Motor Shaft (Extended Drive End to left) */}
          <rect
            x="80"
            y="235"
            width="840"
            height="30"
            rx="4"
            fill="url(#shaftGrad)"
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* Keyway and shaft coupling on drive end */}
          <rect x="90" y="240" width="35" height="8" rx="1" fill="#475569" />
          <line x1="105" y1="230" x2="105" y2="270" stroke="#334155" strokeWidth="2" />

          {/* Stator Outer Frame & Cooling Fins */}
          <g id="stator-housing">
            {/* Main cylindrical stator casing */}
            <rect
              x="250"
              y="110"
              width="500"
              height="280"
              rx="12"
              fill="url(#casingGrad)"
              stroke="#334155"
              strokeWidth="2.5"
            />

            {/* Top Cooling Fins */}
            {[-120, -100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100, 120].map((offset, i) => (
              <rect
                key={`fin-top-${i}`}
                x={485 + offset * 1.8}
                y="92"
                width="8"
                height="20"
                rx="2"
                fill="#334155"
              />
            ))}

            {/* Stator End Bells / Flanges */}
            <path
              d="M 250 110 L 230 180 L 230 320 L 250 390 Z"
              fill="#1E293B"
              stroke="#475569"
              strokeWidth="2"
            />
            <path
              d="M 750 110 L 770 180 L 770 320 L 750 390 Z"
              fill="#1E293B"
              stroke="#475569"
              strokeWidth="2"
            />

            {/* Mounting Feet / Base Pedestal */}
            <path
              d="M 280 390 L 270 435 L 360 435 L 370 390 Z"
              fill="#1E293B"
              stroke="#475569"
              strokeWidth="1.5"
            />
            <circle cx="315" cy="420" r="5" fill="#64748B" />

            <path
              d="M 630 390 L 640 435 L 730 435 L 720 390 Z"
              fill="#1E293B"
              stroke="#475569"
              strokeWidth="1.5"
            />
            <circle cx="685" cy="420" r="5" fill="#64748B" />

            {/* Terminal Connection Box on Stator Top */}
            <rect
              x="620"
              y="60"
              width="90"
              height="52"
              rx="4"
              fill="#1E293B"
              stroke="#475569"
              strokeWidth="1.5"
            />
            <circle cx="645" cy="85" r="5" fill="#EF4444" />
            <circle cx="665" cy="85" r="5" fill="#F59E0B" />
            <circle cx="685" cy="85" r="5" fill="#3B82F6" />
          </g>

          {/* Drive-End (DE) Bearing Housing (Left) */}
          <g id="bearing-de">
            <rect
              x="210"
              y="200"
              width="45"
              height="100"
              rx="4"
              fill={isBearingFault ? '#EF4444' : '#334155'}
              className={isBearingFault ? 'animate-pulse' : ''}
              stroke="#64748B"
              strokeWidth="2"
            />
            {/* Bearing balls */}
            <circle cx="232" cy="220" r="8" fill="#94A3B8" />
            <circle cx="232" cy="240" r="8" fill="#94A3B8" />
            <circle cx="232" cy="260" r="8" fill="#94A3B8" />
            <circle cx="232" cy="280" r="8" fill="#94A3B8" />
            {isBearingFault && (
              <circle cx="232" cy="250" r="35" fill="url(#faultGlow)" pointerEvents="none" />
            )}
          </g>

          {/* Non-Drive-End (NDE) Bearing Housing (Right) */}
          <g id="bearing-nde">
            <rect
              x="745"
              y="200"
              width="45"
              height="100"
              rx="4"
              fill="#334155"
              stroke="#64748B"
              strokeWidth="2"
            />
            <circle cx="767" cy="220" r="8" fill="#94A3B8" />
            <circle cx="767" cy="240" r="8" fill="#94A3B8" />
            <circle cx="767" cy="260" r="8" fill="#94A3B8" />
            <circle cx="767" cy="280" r="8" fill="#94A3B8" />
          </g>

          {/* Internal Cross Section (Stator Core & Copper Windings) */}
          <g id="stator-core">
            {/* Upper Stator Winding Coils */}
            <rect
              x="300"
              y="135"
              width="400"
              height="45"
              rx="4"
              fill={isStatorFault ? '#DC2626' : 'url(#windingGrad)'}
              className={isStatorFault ? 'animate-pulse' : ''}
              stroke="#B45309"
              strokeWidth="1.5"
            />
            {/* Lower Stator Winding Coils */}
            <rect
              x="300"
              y="320"
              width="400"
              height="45"
              rx="4"
              fill={isStatorFault ? '#DC2626' : 'url(#windingGrad)'}
              className={isStatorFault ? 'animate-pulse' : ''}
              stroke="#B45309"
              strokeWidth="1.5"
            />
            {isStatorFault && (
              <circle cx="500" cy="155" r="45" fill="url(#faultGlow)" pointerEvents="none" />
            )}
          </g>

          {/* Rotor Squirrel Cage & Laminations */}
          <g id="rotor-assembly">
            {/* Air gap boundaries */}
            <rect
              x="310"
              y="185"
              width="380"
              height="130"
              rx="4"
              fill={isEccentricityFault ? '#991B1B' : '#0F172A'}
              stroke={isEccentricityFault ? '#EF4444' : '#38BDF8'}
              strokeWidth={isEccentricityFault ? '3' : '1'}
              strokeDasharray={isEccentricityFault ? '4 2' : 'none'}
            />

            {/* Rotor Core Laminations */}
            <rect
              x="320"
              y="195"
              width="360"
              height="110"
              rx="2"
              fill="url(#rotorGrad)"
              stroke="#2563EB"
              strokeWidth="1.5"
            />

            {/* Squirrel Cage Rotor Conductive Bars */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((i) => {
              const barX = 335 + i * 20.5;
              const isBrokenBar = isRotorFault && (i === 7 || i === 8);
              return (
                <g key={`bar-${i}`}>
                  <rect
                    x={barX}
                    y="197"
                    width="6"
                    height="106"
                    rx="1"
                    fill={isBrokenBar ? '#EF4444' : '#93C5FD'}
                    className={isBrokenBar ? 'animate-pulse' : ''}
                  />
                  {isBrokenBar && (
                    <circle cx={barX + 3} cy="250" r="28" fill="url(#faultGlow)" pointerEvents="none" />
                  )}
                </g>
              );
            })}

            {/* Rotor End-Rings (Short-circuiting rings) */}
            <rect x="320" y="193" width="12" height="114" rx="2" fill="#E2E8F0" />
            <rect x="668" y="193" width="12" height="114" rx="2" fill="#E2E8F0" />
          </g>

          {/* Cooling Fan on Non-Drive End */}
          <g id="cooling-fan" opacity="0.85">
            <rect x="795" y="150" width="18" height="200" rx="4" fill="#334155" />
            <path d="M 813 160 Q 845 250 813 340 Z" fill="#475569" stroke="#64748B" />
          </g>

          {/* Dynamic Rotation Arc Indicator on Drive End */}
          <g transform="translate(140, 250)">
            <circle cx="0" cy="0" r="28" fill="none" stroke="#38BDF8" strokeWidth="2" strokeDasharray="14 10" opacity="0.7">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur={`${Math.max(0.4, 60 / (speed || 1440))}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>

          {/* SENSOR PINS & CALLOUTS */}
          {SENSORS.map((sensor) => {
            const isSelected = selectedSensorId === sensor.id;
            const isHovered = hoveredSensor === sensor.id;
            const svgX = (sensor.x / 100) * 1000;
            const svgY = (sensor.y / 100) * 500;
            const sensorVal = getSensorValue(sensor.id);

            return (
              <g
                key={sensor.id}
                transform={`translate(${svgX}, ${svgY})`}
                className={interactive ? 'cursor-pointer' : ''}
                onClick={() => {
                  if (!interactive || !onSelectSensor) return;
                  onSelectSensor(isSelected ? null : sensor.id);
                }}
                onMouseEnter={() => setHoveredSensor(sensor.id)}
                onMouseLeave={() => setHoveredSensor(null)}
              >
                {/* Ping animation on active/selected */}
                {(isSelected || isHovered) && (
                  <circle cx="0" cy="0" r="16" fill="none" stroke="#2458D3" strokeWidth="2" opacity="0.6">
                    <animate attributeName="r" values="8;24" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Target reticle / Pin Base */}
                <circle
                  cx="0"
                  cy="0"
                  r={isSelected ? 11 : 8}
                  fill={isSelected ? '#2458D3' : '#101B2A'}
                  stroke={isSelected ? '#FFFFFF' : '#11A7B5'}
                  strokeWidth="2.5"
                  className="transition-all duration-200"
                />

                {/* Center dot */}
                <circle cx="0" cy="0" r="3" fill={isSelected ? '#FFFFFF' : '#11A7B5'} />

                {/* Sensor Identifier Tag */}
                <g transform="translate(12, -10)">
                  <rect
                    x="0"
                    y="0"
                    width={isSelected || isHovered ? 85 : 55}
                    height="20"
                    rx="4"
                    fill="#101B2A"
                    stroke={isSelected ? '#2458D3' : '#334155'}
                    strokeWidth="1.5"
                    opacity="0.9"
                  />
                  <text
                    x="6"
                    y="14"
                    fill="#F4F7FB"
                    fontSize="11"
                    fontFamily="JetBrains Mono"
                    fontWeight="600"
                  >
                    {sensor.id}
                  </text>
                  {(isSelected || isHovered) && (
                    <text
                      x="32"
                      y="14"
                      fill="#11A7B5"
                      fontSize="9.5"
                      fontFamily="JetBrains Mono"
                    >
                      {sensorVal}
                    </text>
                  )}
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Telemetry Strip across the motor schematic */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-4 border-t border-rule dark:border-rule-dark mt-2 z-10">
        <div className="p-2.5 rounded-lg bg-surface-secondary/70 dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark">
          <div className="flex items-center gap-1.5 text-ink-muted text-[10px] font-mono uppercase">
            <Gauge className="w-3 h-3 text-aerospace" />
            <span>Rotational Speed</span>
          </div>
          <div className="font-mono text-sm sm:text-base font-bold text-ink dark:text-ink-inverse mt-0.5">
            {Math.round(speed)} <span className="text-[11px] font-normal text-ink-muted">RPM</span>
          </div>
          <div className="text-[10px] text-ink-muted font-mono mt-0.5">
            Slip: {(((1500 - speed) / 1500) * 100).toFixed(1)}%
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-surface-secondary/70 dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark">
          <div className="flex items-center gap-1.5 text-ink-muted text-[10px] font-mono uppercase">
            <Zap className="w-3 h-3 text-telemetry-cyan" />
            <span>Current RMS</span>
          </div>
          <div className="font-mono text-sm sm:text-base font-bold text-ink dark:text-ink-inverse mt-0.5">
            {current.toFixed(2)} <span className="text-[11px] font-normal text-ink-muted">A</span>
          </div>
          <div className="text-[10px] text-ink-muted font-mono mt-0.5">
            Rated: 5.80 A (FLA)
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-surface-secondary/70 dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark">
          <div className="flex items-center gap-1.5 text-ink-muted text-[10px] font-mono uppercase">
            <Activity className="w-3 h-3 text-state-warning" />
            <span>Vibration RMS</span>
          </div>
          <div className="font-mono text-sm sm:text-base font-bold text-ink dark:text-ink-inverse mt-0.5">
            {vib.toFixed(2)} <span className="text-[11px] font-normal text-ink-muted">mm/s</span>
          </div>
          <div className="text-[10px] text-ink-muted font-mono mt-0.5">
            ISO 10816 Zone {vib < 1.8 ? 'A' : vib < 4.5 ? 'B' : 'C'}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-surface-secondary/70 dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark">
          <div className="flex items-center gap-1.5 text-ink-muted text-[10px] font-mono uppercase">
            <Flame className="w-3 h-3 text-state-critical" />
            <span>Winding Temp</span>
          </div>
          <div className="font-mono text-sm sm:text-base font-bold text-ink dark:text-ink-inverse mt-0.5">
            {temp.toFixed(1)} <span className="text-[11px] font-normal text-ink-muted">°C</span>
          </div>
          <div className="text-[10px] text-ink-muted font-mono mt-0.5">
            Class F Limit: 105°C
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-surface-secondary/70 dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-ink-muted text-[10px] font-mono uppercase">
            <Disc className="w-3 h-3 text-aerospace" />
            <span>Mechanical Load</span>
          </div>
          <div className="font-mono text-sm sm:text-base font-bold text-ink dark:text-ink-inverse mt-0.5">
            {Math.round(load)} <span className="text-[11px] font-normal text-ink-muted">%</span>
          </div>
          <div className="text-[10px] text-ink-muted font-mono mt-0.5">
            {((load / 100) * 3.0).toFixed(2)} kW Shaft
          </div>
        </div>
      </div>
    </div>
  );
};
