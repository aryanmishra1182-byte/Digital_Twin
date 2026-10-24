import React from 'react';
import { DigitalTwinState } from '../types';

interface SparklineMetricsRowProps {
  twin?: DigitalTwinState;
}

export const SparklineMetricsRow: React.FC<SparklineMetricsRowProps> = ({ twin }) => {
  const currentRms = (twin?.latestCurrentRms ?? 4.15).toFixed(2);
  const vibRms = (twin?.latestVibRms ?? 0.42).toFixed(2);
  const tempC = (twin?.latestTemperatureC ?? 48.5).toFixed(1);
  const speedRpm = Math.round(twin?.latestEstimatedSpeedRpm ?? 1440);
  const vibKurtosis = (twin?.latestVibKurtosis ?? 3.05).toFixed(2);
  const loadPct = (twin?.latestLoadPct ?? 100).toFixed(0);

  // SVG polyline coordinates for visual sparklines
  const pointsCurrent = "0,14 15,12 30,15 45,11 60,13 75,10 90,12 105,11 120,13";
  const pointsVib = twin?.latestVibRms && twin.latestVibRms > 1.0
    ? "0,16 15,14 30,17 45,8 60,5 75,4 90,6 105,3 120,4"
    : "0,15 15,14 30,15 45,14 60,15 75,14 90,15 105,14 120,15";
  const pointsTemp = "0,16 20,15 40,14 60,13 80,12 100,11 120,10";
  const pointsSpeed = "0,12 20,11 40,13 60,12 80,11 100,12 120,12";

  return (
    <div className="py-6 border-b border-rule">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
        {/* Metric 1: Stator Current */}
        <div className="md:pr-6 md:border-r border-rule">
          <span className="block text-xs text-mute font-sans mb-1">
            Stator Current RMS
          </span>
          <div className="flex items-baseline gap-1 font-mono text-2xl font-medium text-ink">
            {currentRms}
            <span className="text-xs text-mute font-normal font-sans">A</span>
          </div>
          <svg className="w-full h-8 mt-2 overflow-visible" viewBox="0 0 120 20">
            <polyline
              points={pointsCurrent}
              fill="none"
              stroke="var(--ink)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Metric 2: Vibration RMS */}
        <div className="md:px-6 md:border-r border-rule">
          <span className="block text-xs text-mute font-sans mb-1">
            Vibration Velocity RMS
          </span>
          <div className="flex items-baseline gap-1 font-mono text-2xl font-medium text-ink">
            {vibRms}
            <span className="text-xs text-mute font-normal font-sans">mm/s</span>
          </div>
          <svg className="w-full h-8 mt-2 overflow-visible" viewBox="0 0 120 20">
            <polyline
              points={pointsVib}
              fill="none"
              stroke={Number(vibRms) > 1.2 ? "var(--bad)" : "var(--ink)"}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Metric 3: Stator Temp */}
        <div className="md:px-6 md:border-r border-rule">
          <span className="block text-xs text-mute font-sans mb-1">
            Stator Casing Temp
          </span>
          <div className="flex items-baseline gap-1 font-mono text-2xl font-medium text-ink">
            {tempC}
            <span className="text-xs text-mute font-normal font-sans">°C</span>
          </div>
          <svg className="w-full h-8 mt-2 overflow-visible" viewBox="0 0 120 20">
            <polyline
              points={pointsTemp}
              fill="none"
              stroke={Number(tempC) > 70 ? "var(--warn)" : "var(--ink)"}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Metric 4: Rotor Speed */}
        <div className="md:pl-6">
          <span className="block text-xs text-mute font-sans mb-1">
            Operating Speed · {loadPct}% Load
          </span>
          <div className="flex items-baseline gap-1 font-mono text-2xl font-medium text-ink">
            {speedRpm}
            <span className="text-xs text-mute font-normal font-sans">RPM</span>
          </div>
          <svg className="w-full h-8 mt-2 overflow-visible" viewBox="0 0 120 20">
            <polyline
              points={pointsSpeed}
              fill="none"
              stroke="var(--ink)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
