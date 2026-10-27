import React, { useState, useMemo, useEffect } from 'react';
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
    color: '#D58B22',
    darkColor: '#F59E0B',
    icon: Activity,
    limit: { value: 1.8, label: 'ISO 10816 Limit (1.8 mm/s)' },
    getValue: (p) => p.vibRms ?? 0,
  },
  {
    key: 'currentRms',
    label: 'Current RMS',
    unit: 'A',
    color: '#2458D3',
    darkColor: '#3B82F6',
    icon: Zap,
    limit: { value: 5.8, label: 'Rated FLA (5.80 A)' },
    getValue: (p) => p.currentRms ?? 0,
  },
  {
    key: 'temperatureC',
    label: 'Temperature',
    unit: '°C',
    color: '#D74444',
    darkColor: '#EF4444',
    icon: Flame,
    limit: { value: 80.0, label: 'Max Thermal Alert (80°C)' },
    getValue: (p) => p.temperatureC ?? 0,
  },
  {
    key: 'loadPct',
    label: 'Load',
    unit: '%',
    color: '#11A7B5',
    darkColor: '#14B8A6',
    icon: Disc,
    getValue: (p) => p.loadPct ?? 0,
  },
  {
    key: 'speed',
    label: 'Shaft Speed',
    unit: 'RPM',
    color: '#3979F6',
    darkColor: '#60A5FA',
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

  // Chart coordinates calculation
  const width = 800;
  const height = 240;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

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
    <div className="rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark p-4 sm:p-5 flex flex-col justify-between">
      {/* Chart Header: Title + Signal Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-aerospace dark:text-aerospace-bright">
              TELEMETRY STREAM ANALYZER
            </span>
            <span className="text-[10px] font-mono text-ink-muted">
              {sortedPoints.length} SAMPLES RECORDED
            </span>
          </div>
          <h3 className="text-sm font-semibold text-ink dark:text-ink-inverse mt-0.5">
            {activeConfig.label} Trend History
          </h3>
        </div>

        {/* Signal Selector Buttons */}
        <div className="flex items-center gap-1 bg-surface-secondary dark:bg-panel-dark-subtle p-1 rounded-lg border border-rule dark:border-rule-dark">
          {SIGNALS.map((sig) => {
            const Icon = sig.icon;
            const isSelected = selectedSignal === sig.key;
            return (
              <button
                key={sig.key}
                type="button"
                onClick={() => handleSelectSignal(sig.key)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-panel dark:bg-panel-dark text-aerospace shadow-sm font-semibold border border-rule dark:border-rule-dark'
                    : 'text-ink-secondary dark:text-ink-muted hover:text-ink dark:hover:text-ink-inverse'
                }`}
                aria-label={`View ${sig.label} signal`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{sig.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main SVG Graph */}
      <div className="relative w-full aspect-[16/6] min-h-[220px] flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 bg-panel/70 dark:bg-panel-dark/70 backdrop-blur-sm flex items-center justify-center z-20">
            <span className="font-mono text-xs text-ink-muted animate-pulse">
              Buffering telemetry stream...
            </span>
          </div>
        )}

        {sortedPoints.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center text-center p-8 text-ink-muted">
            <Activity className="w-8 h-8 opacity-40 mb-2" />
            <p className="font-mono text-xs">No telemetry samples received yet.</p>
            <p className="text-[11px] mt-1">Start the induction motor simulator to stream real-time data.</p>
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
                    stroke="currentColor"
                    strokeOpacity="0.08"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fill="currentColor"
                    fillOpacity="0.5"
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
                  stroke="#EF4444"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  opacity="0.85"
                />
                <text
                  x={width - paddingRight}
                  y={limitY - 5}
                  textAnchor="end"
                  fill="#EF4444"
                  fontSize="9.5"
                  fontFamily="JetBrains Mono"
                  fontWeight="bold"
                >
                  {activeConfig.limit?.label}
                </text>
              </g>
            )}

            {/* Gradient Fill under Path */}
            <defs>
              <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={activeConfig.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={activeConfig.color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {pointsString && (
              <>
                {/* Area under curve */}
                <polygon
                  points={`${paddingLeft},${height - paddingBottom} ${pointsString} ${
                    width - paddingRight
                  },${height - paddingBottom}`}
                  fill="url(#chartAreaGrad)"
                />

                {/* Primary Telemetry Polyline */}
                <polyline
                  fill="none"
                  stroke={activeConfig.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsString}
                />
              </>
            )}

            {/* Data point markers */}
            {values.map((val, idx) => {
              const x = paddingLeft + (idx / (values.length - 1 || 1)) * plotWidth;
              const normalizedY = (val - minVal) / (maxVal - minVal || 1);
              const y = height - paddingBottom - normalizedY * plotHeight;
              const isHovered = hoverIndex === idx;

              return (
                <g key={`pt-${idx}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 5 : 2.5}
                    fill={isHovered ? '#FFFFFF' : activeConfig.color}
                    stroke={activeConfig.color}
                    strokeWidth={isHovered ? 2.5 : 1}
                    className="transition-all"
                  />
                  {/* Invisible hit target for hover */}
                  <rect
                    x={x - 10}
                    y={paddingTop}
                    width={20}
                    height={plotHeight}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={() => setHoverIndex(idx)}
                    onMouseLeave={() => setHoverIndex(null)}
                  />
                </g>
              );
            })}

            {/* Hover Tooltip Overlay in SVG */}
            {hoverIndex !== null && sortedPoints[hoverIndex] && (
              <g>
                {(() => {
                  const pt = sortedPoints[hoverIndex];
                  const val = activeConfig.getValue(pt);
                  const x = paddingLeft + (hoverIndex / (values.length - 1 || 1)) * plotWidth;
                  const normalizedY = (val - minVal) / (maxVal - minVal || 1);
                  const y = height - paddingBottom - normalizedY * plotHeight;
                  const timeStr = new Date(pt.timestamp).toLocaleTimeString();

                  return (
                    <g transform={`translate(${Math.min(x, width - 110)}, ${Math.max(y - 45, 10)})`}>
                      {/* Vertical tracker line */}
                      <line
                        x1="0"
                        y1={45}
                        x2="0"
                        y2={height - paddingBottom - Math.max(y - 45, 10)}
                        stroke="#2458D3"
                        strokeDasharray="2 2"
                        strokeWidth="1"
                        opacity="0.7"
                      />
                      <rect
                        x="-45"
                        y="0"
                        width="90"
                        height="36"
                        rx="4"
                        fill="#101B2A"
                        stroke="#2458D3"
                        strokeWidth="1"
                        opacity="0.95"
                      />
                      <text
                        x="0"
                        y="14"
                        textAnchor="middle"
                        fill="#F4F7FB"
                        fontSize="9.5"
                        fontFamily="JetBrains Mono"
                        fontWeight="bold"
                      >
                        {val.toFixed(2)} {activeConfig.unit}
                      </text>
                      <text
                        x="0"
                        y="27"
                        textAnchor="middle"
                        fill="#7B8999"
                        fontSize="8.5"
                        fontFamily="JetBrains Mono"
                      >
                        {timeStr}
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}

            {/* Time Axis Labels (Bottom) */}
            {sortedPoints.length > 0 && (
              <g fill="currentColor" fillOpacity="0.5" fontSize="9" fontFamily="JetBrains Mono">
                <text x={paddingLeft} y={height - 8} textAnchor="start">
                  {new Date(sortedPoints[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </text>
                <text x={paddingLeft + plotWidth / 2} y={height - 8} textAnchor="middle">
                  {new Date(sortedPoints[Math.floor(sortedPoints.length / 2)].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </text>
                <text x={width - paddingRight} y={height - 8} textAnchor="end">
                  {new Date(sortedPoints[sortedPoints.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </text>
              </g>
            )}
          </svg>
        )}
      </div>

      {/* Chart Footer metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-rule dark:border-rule-dark text-xs font-mono text-ink-muted">
        <div>
          Latest: <span className="font-bold text-ink dark:text-ink-inverse">{latestValue != null ? `${latestValue.toFixed(2)} ${activeConfig.unit}` : '–'}</span>
        </div>
        <div>
          Sampling: 10 kHz Decimated to 1 Hz · Provenance: Synthetic Simulation
        </div>
      </div>
    </div>
  );
};
