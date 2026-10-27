import React, { useState, useMemo } from 'react';
import { TelemetryPoint } from '../../types';
import { Activity, Zap, Flame, Gauge, Disc } from 'lucide-react';

export type SignalKey = 'currentRms' | 'vibRms' | 'temperatureC' | 'loadPct' | 'speed';

interface SignalConfig {
  key: SignalKey;
  label: string;
  unit: string;
  color: string;
  darkColor: string;
  icon: React.ComponentType<{ className?: string }>;
  limit?: { value: number; label: string };
  getValue: (p: TelemetryPoint) => number;
}

export const SIGNALS: SignalConfig[] = [
  {
    key: 'vibRms',
    label: 'Vibration RMS',
    unit: 'mm/s',
    color: '#D99A35',
    darkColor: '#D99A35',
    icon: Activity,
    limit: { value: 1.8, label: 'ISO 10816 Limit (1.8 mm/s)' },
    getValue: (p) => p.vibRms ?? 0,
  },
  {
    key: 'currentRms',
    label: 'Current RMS',
    unit: 'A',
    color: '#355D8B',
    darkColor: '#355D8B',
    icon: Zap,
    limit: { value: 5.8, label: 'Rated FLA (5.80 A)' },
    getValue: (p) => p.currentRms ?? 0,
  },
  {
    key: 'temperatureC',
    label: 'Temperature',
    unit: '°C',
    color: '#C94B50',
    darkColor: '#C94B50',
    icon: Flame,
    limit: { value: 80.0, label: 'Max Thermal Alert (80°C)' },
    getValue: (p) => p.temperatureC ?? 0,
  },
  {
    key: 'loadPct',
    label: 'Load',
    unit: '%',
    color: '#68409A',
    darkColor: '#9B6DCC',
    icon: Disc,
    getValue: (p) => p.loadPct ?? 0,
  },
  {
    key: 'speed',
    label: 'Shaft Speed',
    unit: 'RPM',
    color: '#27866F',
    darkColor: '#27866F',
    icon: Gauge,
    limit: { value: 1440, label: 'Rated Speed (1440 RPM)' },
    getValue: (p) => Math.round(1500 - ((p.loadPct || 100) / 100) * 60),
  },
];

interface TelemetryChartProps {
  telemetry: TelemetryPoint[];
  loading?: boolean;
  activeSignal?: SignalKey;
  onSignalChange?: (key: SignalKey) => void;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  telemetry,
  loading,
  activeSignal,
  onSignalChange,
}) => {
  const [internalSignal, setInternalSignal] = useState<SignalKey>('vibRms');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const selectedSignal = activeSignal || internalSignal;

  const handleSelectSignal = (key: SignalKey) => {
    setInternalSignal(key);
    if (onSignalChange) onSignalChange(key);
  };

  const activeConfig = SIGNALS.find((s) => s.key === selectedSignal) || SIGNALS[0];

  // Prepare points ordered by timestamp ascending
  const sortedPoints = useMemo(() => {
    return [...telemetry].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [telemetry]);

  const values = useMemo(() => {
    return sortedPoints.map((p) => activeConfig.getValue(p));
  }, [sortedPoints, activeConfig]);

  // Compute min/max for scale
  const { minVal, maxVal } = useMemo(() => {
    if (values.length === 0) return { minVal: 0, maxVal: 10 };
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (activeConfig.limit) {
      max = Math.max(max, activeConfig.limit.value * 1.15);
    }
    if (min === max) {
      min = min * 0.8;
      max = max * 1.2 || 1;
    }
    const padding = (max - min) * 0.1;
    return {
      minVal: Math.max(0, min - padding),
      maxVal: max + padding,
    };
  }, [values, activeConfig]);

  // Chart dimensions
  const width = 800;
  const height = 230;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 28;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const pointsString = useMemo(() => {
    if (values.length < 2) return '';
    return values
      .map((val, idx) => {
        const x = paddingLeft + (idx / (values.length - 1)) * plotWidth;
        const normalizedY = (val - minVal) / (maxVal - minVal || 1);
        const y = height - paddingBottom - normalizedY * plotHeight;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [values, minVal, maxVal, plotWidth, plotHeight, width, height]);

  // Limit line Y coordinate
  const limitY = useMemo(() => {
    if (!activeConfig.limit) return null;
    const normalizedY = (activeConfig.limit.value - minVal) / (maxVal - minVal || 1);
    if (normalizedY < 0 || normalizedY > 1) return null;
    return height - paddingBottom - normalizedY * plotHeight;
  }, [activeConfig, minVal, maxVal, plotHeight, height]);

  // Latest value
  const latestValue = values.length > 0 ? values[values.length - 1] : null;

  return (
    <div className="rounded-md bg-white border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col justify-between">
      {/* Chart Header: IBM Watson IoT Header Bar */}
      <div className="h-10 px-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded bg-[#68409A]" />
          <h3 className="font-mono text-xs font-bold text-[#253746] uppercase tracking-wider">
            Telemetry Trend — {activeConfig.label}
          </h3>
          <span className="text-[10px] font-mono text-[#718096]">
            ({sortedPoints.length} windows)
          </span>
        </div>

        {/* Signal Selector Tabs */}
        <div className="flex items-center gap-1">
          {SIGNALS.map((sig) => {
            const Icon = sig.icon;
            const isSelected = selectedSignal === sig.key;
            return (
              <button
                key={sig.key}
                type="button"
                onClick={() => handleSelectSignal(sig.key)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium flex items-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-[#68409A] text-white shadow-xs font-semibold'
                    : 'text-[#718096] hover:bg-[#E2E8F0] hover:text-[#253746]'
                }`}
                aria-label={`View ${sig.label} signal`}
              >
                <Icon className="w-3 h-3" />
                <span>{sig.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main SVG Graph */}
      <div className="p-4">
        <div className="relative w-full aspect-[16/6] min-h-[200px] flex items-center justify-center bg-[#FAFCFE] rounded border border-[#EDF2F7]">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-20">
              <span className="font-mono text-xs text-[#718096] animate-pulse">
                Buffering telemetry stream...
              </span>
            </div>
          )}

          {sortedPoints.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center text-center p-8 text-[#718096]">
              <Activity className="w-7 h-7 opacity-40 mb-2 text-[#355D8B]" />
              <p className="font-mono text-xs text-[#253746] font-semibold">No telemetry samples received yet.</p>
              <p className="text-[11px] text-[#718096] mt-0.5">Start the induction motor simulator to stream real-time data.</p>
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full select-none"
              preserveAspectRatio="none"
            >
              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = paddingTop + ratio * plotHeight;
                const tickVal = maxVal - ratio * (maxVal - minVal);
                return (
                  <g key={`grid-y-${ratio}`}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={width - paddingRight}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fill="#718096"
                      fontSize="9.5"
                      fontFamily="JetBrains Mono"
                    >
                      {tickVal.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Reference Limit Line (e.g. ISO 10816 or Rated FLA) */}
              {limitY !== null && (
                <g>
                  <line
                    x1={paddingLeft}
                    y1={limitY}
                    x2={width - paddingRight}
                    y2={limitY}
                    stroke="#C94B50"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />
                  <text
                    x={width - paddingRight}
                    y={limitY - 5}
                    textAnchor="end"
                    fill="#C94B50"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    fontWeight="600"
                  >
                    {activeConfig.limit?.label}
                  </text>
                </g>
              )}

              {/* Area gradient under curve */}
              {pointsString && (
                <defs>
                  <linearGradient id="telemetryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={activeConfig.color} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={activeConfig.color} stopOpacity="0.01" />
                  </linearGradient>
                </defs>
              )}

              {/* Area fill */}
              {pointsString && (
                <polygon
                  points={`${paddingLeft},${height - paddingBottom} ${pointsString} ${width - paddingRight},${height - paddingBottom}`}
                  fill="url(#telemetryGradient)"
                />
              )}

              {/* Main signal polyline */}
              {pointsString && (
                <polyline
                  points={pointsString}
                  fill="none"
                  stroke={activeConfig.color}
                  strokeWidth="2.0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Individual data point dots & hover targets */}
              {values.map((val, idx) => {
                const x = paddingLeft + (idx / (values.length - 1 || 1)) * plotWidth;
                const normalizedY = (val - minVal) / (maxVal - minVal || 1);
                const y = height - paddingBottom - normalizedY * plotHeight;
                const isHovered = hoverIndex === idx;

                return (
                  <g
                    key={`dot-${idx}`}
                    onMouseEnter={() => setHoverIndex(idx)}
                    onMouseLeave={() => setHoverIndex(null)}
                    className="cursor-pointer"
                  >
                    {/* Hover hotspot */}
                    <circle cx={x} cy={y} r="10" fill="transparent" />
                    {/* Visual dot */}
                    {(isHovered || idx === values.length - 1) && (
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? '4.5' : '3'}
                        fill={activeConfig.color}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                    )}
                  </g>
                );
              })}

              {/* X Axis Baseline */}
              <line
                x1={paddingLeft}
                y1={height - paddingBottom}
                x2={width - paddingRight}
                y2={height - paddingBottom}
                stroke="#CBD5E1"
                strokeWidth="1"
              />

              {/* X Axis Labels */}
              <text
                x={paddingLeft}
                y={height - 10}
                fill="#718096"
                fontSize="9"
                fontFamily="JetBrains Mono"
              >
                {sortedPoints.length > 0
                  ? new Date(sortedPoints[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'Start'}
              </text>
              <text
                x={width - paddingRight}
                y={height - 10}
                textAnchor="end"
                fill="#718096"
                fontSize="9"
                fontFamily="JetBrains Mono"
              >
                {sortedPoints.length > 0
                  ? new Date(sortedPoints[sortedPoints.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'Latest'}
              </text>
            </svg>
          )}

          {/* Interactive Tooltip Card */}
          {hoverIndex !== null && sortedPoints[hoverIndex] && (
            <div
              className="absolute pointer-events-none bg-white p-2 rounded shadow-md border border-[#E2E8F0] text-[11px] font-mono z-30"
              style={{
                left: `${(paddingLeft + (hoverIndex / (values.length - 1 || 1)) * plotWidth) / 8}%`,
                top: '15px',
              }}
            >
              <div className="font-bold text-[#253746]">
                {values[hoverIndex].toFixed(2)} {activeConfig.unit}
              </div>
              <div className="text-[10px] text-[#718096]">
                {new Date(sortedPoints[hoverIndex].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          )}
        </div>

        {/* Compact Bottom Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#E2E8F0] mt-3">
          <div className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[9px] font-mono uppercase text-[#718096] block">Latest Value</span>
            <span className="font-mono text-sm font-bold text-[#253746] block mt-0.5">
              {latestValue != null ? `${latestValue.toFixed(2)} ${activeConfig.unit}` : 'N/A'}
            </span>
          </div>
          <div className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[9px] font-mono uppercase text-[#718096] block">Average</span>
            <span className="font-mono text-sm font-semibold text-[#253746] block mt-0.5">
              {values.length > 0 ? `${(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)} ${activeConfig.unit}` : 'N/A'}
            </span>
          </div>
          <div className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[9px] font-mono uppercase text-[#718096] block">Peak Recorded</span>
            <span className="font-mono text-sm font-semibold text-[#253746] block mt-0.5">
              {values.length > 0 ? `${Math.max(...values).toFixed(2)} ${activeConfig.unit}` : 'N/A'}
            </span>
          </div>
          <div className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[9px] font-mono uppercase text-[#718096] block">Alert Limit</span>
            <span className="font-mono text-sm font-semibold text-[#C94B50] block mt-0.5">
              {activeConfig.limit ? `${activeConfig.limit.value} ${activeConfig.unit}` : 'None'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
