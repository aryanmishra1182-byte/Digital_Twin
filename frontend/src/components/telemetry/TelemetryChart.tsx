import React, { useState, useMemo } from 'react';
import { TelemetryPoint } from '../../types';

export type SignalKey = 'vibRms' | 'currentRms' | 'temperatureC' | 'loadPct' | 'speed';

interface SignalConfig {
  key: SignalKey;
  label: string;
  unit: string;
  color: string;
  getValue: (p: TelemetryPoint) => number;
}

export const SIGNALS: SignalConfig[] = [
  {
    key: 'vibRms',
    label: 'Vibration',
    unit: 'mm/s',
    color: '#D97706',
    getValue: (p) => p.vibRms ?? 0,
  },
  {
    key: 'currentRms',
    label: 'Current',
    unit: 'A',
    color: '#2563EB',
    getValue: (p) => p.currentRms ?? 0,
  },
  {
    key: 'temperatureC',
    label: 'Temperature',
    unit: '°C',
    color: '#DC2626',
    getValue: (p) => p.temperatureC ?? 0,
  },
  {
    key: 'loadPct',
    label: 'Load',
    unit: '%',
    color: '#7C3AED',
    getValue: (p) => p.loadPct ?? 0,
  },
  {
    key: 'speed',
    label: 'Shaft speed',
    unit: 'RPM',
    color: '#059669',
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

  const sortedPoints = useMemo(() => {
    return [...telemetry].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [telemetry]);

  const values = useMemo(() => {
    return sortedPoints.map((p) => activeConfig.getValue(p));
  }, [sortedPoints, activeConfig]);

  const { minVal, maxVal, avgVal, peakVal } = useMemo(() => {
    if (values.length === 0) return { minVal: 0, maxVal: 10, avgVal: 0, peakVal: 0 };
    let min = Math.min(...values);
    let max = Math.max(...values);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = sum / values.length;
    const peak = max;

    if (min === max) {
      min = min * 0.8;
      max = max * 1.2 || 1;
    }
    const padding = (max - min) * 0.15;
    return {
      minVal: Math.max(0, min - padding),
      maxVal: max + padding,
      avgVal: avg,
      peakVal: peak,
    };
  }, [values]);

  const width = 800;
  const height = 220;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 25;

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

  const areaString = useMemo(() => {
    if (!pointsString || values.length < 2) return '';
    const firstX = paddingLeft;
    const lastX = paddingLeft + plotWidth;
    const bottomY = height - paddingBottom;
    return `${firstX},${bottomY} ${pointsString} ${lastX},${bottomY}`;
  }, [pointsString, values, plotWidth, height, paddingBottom]);

  return (
    <div className="rounded-lg bg-white dark:bg-[#132736] border border-slate-200 dark:border-[#1E3B50] p-4 flex flex-col justify-between">
      {/* Header with Title and Signal Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Telemetry
        </h3>

        {/* Signal Selection Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0B202C] p-1 rounded-md">
          {SIGNALS.map((sig) => {
            const isSelected = selectedSignal === sig.key;
            return (
              <button
                key={sig.key}
                type="button"
                onClick={() => handleSelectSignal(sig.key)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-white dark:bg-[#1C3B4E] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {sig.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main SVG Graph */}
      <div className="relative w-full aspect-[16/6] min-h-[190px] flex items-center justify-center bg-slate-50/50 dark:bg-[#0E202D] rounded border border-slate-100 dark:border-[#1C3B4E]">
        {loading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-black/50 flex items-center justify-center z-10">
            <span className="text-xs text-slate-500">Loading telemetry...</span>
          </div>
        )}

        {sortedPoints.length === 0 && !loading ? (
          <div className="text-center p-6 text-slate-400">
            <p className="text-xs">No telemetry data recorded yet.</p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full select-none"
            preserveAspectRatio="none"
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id={`gradient-${selectedSignal}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={activeConfig.color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={activeConfig.color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.33, 0.66, 1].map((ratio) => {
              const y = paddingTop + ratio * plotHeight;
              const tickVal = maxVal - ratio * (maxVal - minVal);
              return (
                <g key={`grid-${ratio}`}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-[#1C3B4E]"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={paddingLeft - 6}
                    y={y + 3.5}
                    textAnchor="end"
                    className="fill-slate-400 text-[10px]"
                  >
                    {tickVal.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            {areaString && (
              <polygon points={areaString} fill={`url(#gradient-${selectedSignal})`} />
            )}

            {/* Line Series */}
            {pointsString && (
              <polyline
                fill="none"
                stroke={activeConfig.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsString}
              />
            )}

            {/* Interactive Hover Crosshair */}
            {hoverIndex !== null && hoverIndex < values.length && (
              (() => {
                const x = paddingLeft + (hoverIndex / (values.length - 1 || 1)) * plotWidth;
                const normalizedY = (values[hoverIndex] - minVal) / (maxVal - minVal || 1);
                const y = height - paddingBottom - normalizedY * plotHeight;
                return (
                  <g>
                    <line
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={height - paddingBottom}
                      stroke="#94A3B8"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill={activeConfig.color}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  </g>
                );
              })()
            )}

            {/* Transparent touch targets for hover */}
            {values.map((_, idx) => {
              const sliceWidth = plotWidth / (values.length || 1);
              const x = paddingLeft + idx * sliceWidth - sliceWidth / 2;
              return (
                <rect
                  key={`hover-col-${idx}`}
                  x={Math.max(paddingLeft, x)}
                  y={paddingTop}
                  width={sliceWidth}
                  height={plotHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoverIndex(idx)}
                />
              );
            })}
          </svg>
        )}
      </div>

      {/* Calculated Stats Summary Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-[#1E3B50]">
        <div className="flex items-center gap-4">
          <span>
            Average:{' '}
            <strong className="font-semibold text-slate-700 dark:text-slate-200">
              {avgVal.toFixed(2)} {activeConfig.unit}
            </strong>
          </span>
          <span>
            Peak:{' '}
            <strong className="font-semibold text-slate-700 dark:text-slate-200">
              {peakVal.toFixed(2)} {activeConfig.unit}
            </strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          {sortedPoints.length} samples
        </span>
      </div>
    </div>
  );
};
