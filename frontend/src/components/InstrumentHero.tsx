import React from 'react';
import { DigitalTwinState } from '../types';

interface InstrumentHeroProps {
  twin?: DigitalTwinState;
  onOpenSimulator?: () => void;
}

export const InstrumentHero: React.FC<InstrumentHeroProps> = ({ twin, onOpenSimulator }) => {
  const health = Math.round(twin?.healthScore ?? 92);
  const faultClass = twin?.predictedFaultClass ?? 'HEALTHY';
  const confidence = Math.round((twin?.confidence ?? 0.94) * 100);
  const anomalyScore = (twin?.anomalyScore ?? (faultClass === 'HEALTHY' ? 0.08 : 0.82)).toFixed(2);
  const rulHours = twin?.estimatedRulHours != null ? `${twin.estimatedRulHours.toFixed(1)} h` : '18.4 h';

  // Ring circumference for r=70: 2 * Math.PI * 70 = 439.82
  const circ = 439.82;
  const strokeOffset = circ - (circ * health) / 100;

  let ringColor = 'var(--ok)';
  let verdictTitle = 'Normal steady-state operation';
  let verdictLede = 'Balanced three-phase stator current, minimal spectral sidebands, and vibration within ISO 10816-3 Class I limits (<0.71 mm/s RMS).';

  if (health < 60 || faultClass !== 'HEALTHY') {
    if (faultClass === 'BROKEN_ROTOR_BAR') {
      verdictTitle = 'Broken rotor bar signature detected';
      verdictLede = 'Asymmetric rotor cage creates MCSA fundamental sidebands f_br = fs(1 ± 2s) at 46.0 Hz and 54.0 Hz with sideband power ratio > 0.045.';
      ringColor = 'var(--bad)';
    } else if (faultClass === 'STATOR_INTER_TURN_SHORT') {
      verdictTitle = 'Stator inter-turn short circuit detected';
      verdictLede = 'Localized winding insulation degradation generates circulating high-current loops, negative-sequence imbalance, and thermal dissipation hot spots.';
      ringColor = 'var(--warn)';
    } else if (faultClass === 'BEARING_DEFECT') {
      verdictTitle = 'Bearing outer race defect detected';
      verdictLede = 'Rolling element passing raceway flaking creates periodic mechanical shock pulses at BPFO (78.4 Hz) with elevated vibration kurtosis (>3.8).';
      ringColor = 'var(--bad)';
    } else if (faultClass === 'AIR_GAP_ECCENTRICITY') {
      verdictTitle = 'Air-gap dynamic eccentricity detected';
      verdictLede = 'Radial rotor displacement creates non-uniform permeance waves, elevating rotational speed vibration (24 Hz) and high-frequency slot harmonics.';
      ringColor = 'var(--warn)';
    } else {
      verdictTitle = `${faultClass.replace(/_/g, ' ')} detected`;
      verdictLede = 'Multi-stage digital twin pipeline flagged anomalous spectral features exceeding nominal baseline bounds.';
      ringColor = 'var(--bad)';
    }
  }

  return (
    <div className="py-6 border-b border-rule">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-8 items-center">
        {/* SVG Health Ring */}
        <div className="relative w-full max-w-[240px] md:max-w-[280px] aspect-square mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle
              className="fill-none stroke-track"
              strokeWidth="9"
              cx="80"
              cy="80"
              r="70"
            />
            <circle
              className="fill-none transition-all duration-1000 ease-out"
              strokeWidth="9"
              strokeLinecap="round"
              cx="80"
              cy="80"
              r="70"
              strokeDasharray={circ}
              strokeDashoffset={strokeOffset}
              style={{ stroke: ringColor }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-serif text-5xl md:text-6xl text-ink font-normal tracking-tight font-mono">
              {health}
            </span>
            <span className="text-xs text-mute mt-1 font-sans">
              Health Index · /100
            </span>
          </div>
        </div>

        {/* Verdict & Three Primary Facts */}
        <div className="flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: ringColor }}
            />
            <span className="text-xs uppercase font-mono tracking-wider text-mute">
              Stage 2 Verdict · {faultClass}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-normal text-ink leading-tight mb-2 max-w-xl">
            {verdictTitle}
          </h2>

          <p className="text-sm text-mute leading-relaxed max-w-2xl mb-6 font-sans">
            {verdictLede}
          </p>

          <div className="grid grid-cols-3 gap-4 sm:gap-8 border-t border-rule pt-4 max-w-lg">
            <div className="border-l border-rule pl-3">
              <span className="block font-mono text-xl sm:text-2xl font-medium text-ink">
                {anomalyScore}
              </span>
              <span className="text-xs text-mute font-sans">Stage 1 Anomaly</span>
            </div>

            <div className="border-l border-rule pl-3">
              <span className="block font-mono text-xl sm:text-2xl font-medium text-ink">
                {confidence}%
              </span>
              <span className="text-xs text-mute font-sans">Confidence</span>
            </div>

            <div className="border-l border-rule pl-3">
              <span className="block font-mono text-xl sm:text-2xl font-medium text-ink">
                {rulHours}
              </span>
              <span className="text-xs text-mute font-sans">Estimated RUL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
