import React from 'react';

export interface AttributionItem {
  feature: string;
  name?: string;
  value: number;
  shapValue: number;
  physicsReason?: string;
}

interface DivergingShapSectionProps {
  attributions?: AttributionItem[];
  predictedClass?: string;
}

export const DivergingShapSection: React.FC<DivergingShapSectionProps> = ({
  attributions,
  predictedClass = "FAULT"
}) => {
  // Default physics-guided attributions if none provided
  const items: AttributionItem[] = attributions && attributions.length > 0 ? attributions : [
    {
      feature: 'brb_sideband_ratio',
      name: 'Broken Rotor Bar Sideband Ratio',
      value: 0.052,
      shapValue: 0.38,
      physicsReason: 'MCSA spectral power at f_br = fs(1 ± 2s) = 46.0 Hz and 54.0 Hz exceeds healthy threshold (0.015).'
    },
    {
      feature: 'vib_kurtosis',
      name: 'Vibration Signal Kurtosis',
      value: 4.82,
      shapValue: 0.29,
      physicsReason: 'Higher-order moment detects heavy-tailed non-Gaussian impulses from raceway surface spalling.'
    },
    {
      feature: 'current_thd',
      name: 'Total Harmonic Distortion (THD)',
      value: 0.068,
      shapValue: 0.18,
      physicsReason: 'Non-linear stator air-gap permeance distortion elevates 3rd and 5th harmonic components.'
    },
    {
      feature: 'vib_rms',
      name: 'Vibration Acceleration RMS',
      value: 1.48,
      shapValue: -0.12,
      physicsReason: 'Moderate velocity amplitude suppresses catastrophic bearing failure probability.'
    },
    {
      feature: 'temp_rate_of_change',
      name: 'Thermal Rise Rate (dT/dt)',
      value: 0.012,
      shapValue: -0.08,
      physicsReason: 'Stator frame thermal dissipation is within equilibrium cooling limits.'
    }
  ];

  const maxAbs = Math.max(...items.map((i) => Math.abs(i.shapValue)), 0.4);

  return (
    <div className="py-6 border-b border-rule">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-4">
        <div>
          <h3 className="text-xl font-serif font-normal text-ink">
            Physics-Guided Feature Attribution (TreeSHAP)
          </h3>
          <p className="text-xs text-mute mt-1 font-sans">
            Diverging marginal contribution to classifier log-odds for <span className="font-mono font-medium text-ink">{predictedClass}</span>
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-sans text-mute mt-2 sm:mt-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-bad" />
            <span>Increases Risk (+SHAP)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-neg" />
            <span>Supports Healthy (-SHAP)</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => {
          const isPos = item.shapValue >= 0;
          const widthPct = Math.min(50, (Math.abs(item.shapValue) / maxAbs) * 50);

          return (
            <div key={idx} className="border-t border-rule/60 pt-3 first:border-0 first:pt-0">
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_90px] items-center gap-3">
                {/* Feature Label */}
                <div>
                  <div className="font-mono text-xs text-ink truncate" title={item.feature}>
                    {item.feature}
                  </div>
                  <div className="text-[11px] text-mute font-sans truncate">
                    {item.name || item.feature}
                  </div>
                </div>

                {/* Diverging Bar Axis */}
                <div className="relative h-6 bg-panel border border-rule/60 rounded flex items-center px-2 overflow-hidden">
                  {/* Center zero line */}
                  <div className="absolute left-1/2 top-0 bottom-0 border-l border-rule z-10" />

                  {/* Positive Bar (Right) */}
                  {isPos && (
                    <div
                      className="absolute top-1.5 bottom-1.5 bg-bad rounded-r transition-all duration-700"
                      style={{
                        left: '50%',
                        width: `${widthPct}%`,
                      }}
                    />
                  )}

                  {/* Negative Bar (Left) */}
                  {!isPos && (
                    <div
                      className="absolute top-1.5 bottom-1.5 bg-neg rounded-l transition-all duration-700"
                      style={{
                        right: '50%',
                        width: `${widthPct}%`,
                      }}
                    />
                  )}
                </div>

                {/* Values (Feature Value + SHAP) */}
                <div className="text-right font-mono text-xs">
                  <span className={`font-medium ${isPos ? 'text-bad' : 'text-neg'}`}>
                    {item.shapValue > 0 ? `+${item.shapValue.toFixed(3)}` : item.shapValue.toFixed(3)}
                  </span>
                  <div className="text-[10px] text-mute">
                    val: {item.value.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Physical mechanism explanation */}
              {item.physicsReason && (
                <div className="text-xs text-mute mt-1.5 pl-1 font-sans border-l-2 border-rule ml-1 py-0.5">
                  <span className="font-medium text-ink">Physical Signature:</span> {item.physicsReason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
