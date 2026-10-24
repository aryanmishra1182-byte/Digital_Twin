import React, { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { DigitalTwinState, AlertRecord, TelemetryPoint, SimulatorStatus } from '../types';
import { getPlainInfo, getStatusWord, getFriendlyFeatureName, formatRelativeTime } from '../lib/plain';

export const Monitor: React.FC = () => {
  const [twins, setTwins] = useState<DigitalTwinState[]>([]);
  const [selectedMotorId, setSelectedMotorId] = useState<string>('');
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [simStatus, setSimStatus] = useState<SimulatorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [trendTab, setTrendTab] = useState<'current' | 'vibration' | 'temperature'>('vibration');

  const [demoFault, setDemoFault] = useState<string>('BEARING_DEFECT');
  const [demoSeverity, setDemoSeverity] = useState<number>(0.60);
  const [demoStarting, setDemoStarting] = useState(false);
  const [noteMap, setNoteMap] = useState<Record<number, string>>({});
  const [showNoteField, setShowNoteField] = useState<Record<number, boolean>>({});
  const demoRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [allTwins, allAlerts, sim] = await Promise.all([
        api.getAllTwins().catch(() => null),
        api.getAlerts().catch(() => []),
        api.getSimulatorStatus().catch(() => null)
      ]);

      if (allTwins === null) {
        setBackendError(true);
        setLoading(false);
        return;
      }

      setBackendError(false);
      setTwins(allTwins);
      setAlerts(allAlerts);
      setSimStatus(sim);

      const currentId = selectedMotorId || (allTwins[0]?.motorId || '');
      if (currentId && (!selectedMotorId || !allTwins.some(t => t.motorId === selectedMotorId))) {
        setSelectedMotorId(currentId);
      }

      if (currentId) {
        const hist = await api.getTelemetryHistory(currentId, 30).catch(() => []);
        setTelemetry([...hist].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
      }
    } catch {
      setBackendError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedMotorId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (document.visibilityState !== 'hidden') fetchData();
    }, 3000);
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchData]);

  const handleToggleDemo = async () => {
    setDemoStarting(true);
    try {
      if (simStatus?.isRunning) {
        await api.stopSimulator();
      } else {
        const mid = selectedMotorId || twins[0]?.motorId || 'MOTOR-01';
        await api.startSimulator(mid, demoFault, demoSeverity, 75);
      }
      await fetchData();
    } finally {
      setDemoStarting(false);
    }
  };

  if (backendError) {
    return (
      <div className="py-12 text-center space-y-4">
        <h2 className="text-xl font-serif text-bad">Connection problem</h2>
        <p className="text-mute max-w-md mx-auto">
          Can't reach the monitor. Check that the backend is running on port 8080.
        </p>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className="min-h-[44px] px-6 py-2.5 rounded border border-ink bg-ink text-bg font-medium hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-rule/50 rounded w-1/3"></div>
        <div className="h-40 bg-rule/30 rounded"></div>
      </div>
    );
  }

  const activeTwin = twins.find(t => t.motorId === selectedMotorId) || twins[0];
  const activeAlerts = alerts.filter(a => a.motorId === selectedMotorId && a.status === 'ACTIVE');

  if (!activeTwin) {
    return (
      <div className="py-12 space-y-8">
        <div className="text-center space-y-3 py-6 border-b border-rule">
          <h2 className="text-2xl font-serif">No motor is reporting yet</h2>
          <p className="text-mute">
            Live telemetry has not arrived. You can start a simulated test run below to see how the monitor works.
          </p>
          <button
            onClick={() => demoRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="min-h-[44px] px-5 py-2.5 rounded border border-ink bg-ink text-bg font-medium hover:opacity-90"
          >
            Go to demo setup
          </button>
        </div>
        <div ref={demoRef} id="demo-section">
          {renderDemoBox(simStatus, demoFault, setDemoFault, demoSeverity, setDemoSeverity, demoStarting, handleToggleDemo, true)}
        </div>
      </div>
    );
  }

  const plainInfo = getPlainInfo(activeTwin.predictedFaultClass);
  const statusWord = getStatusWord(activeTwin.operationalState);
  const isHealthy = activeTwin.operationalState === 'HEALTHY';
  const isWarning = activeTwin.operationalState === 'WARNING';
  const ringColor = isHealthy ? 'var(--ok)' : (isWarning ? 'var(--warn)' : 'var(--bad)');
  const healthScore = Math.max(0, Math.min(100, Math.round(activeTwin.healthScore || 0)));
  const circumference = 2 * Math.PI * 42;
  const strokeOffset = circumference - (healthScore / 100) * circumference;

  const topAttrs = activeTwin.topShapAttributions || [];
  const top4 = topAttrs.slice(0, 4);
  const firstAttr = top4[0]?.feature_name?.toLowerCase() || '';
  const attributionSentence = firstAttr.includes('vib') || firstAttr.includes('kurtosis') || firstAttr.includes('bpfo')
    ? 'Mostly the vibration readings pushed this result.'
    : (firstAttr.includes('current') || firstAttr.includes('brb') || firstAttr.includes('thd')
      ? 'Mostly the electrical current readings pushed this result.'
      : 'Current, vibration and temperature readings all inform this result.');

  const points = telemetry.map(p => {
    if (trendTab === 'current') return p.currentRms || 0;
    if (trendTab === 'temperature') return p.temperatureC || 0;
    return p.vibRms || 0;
  });

  return (
    <div className="space-y-8 py-6">
      {/* 1. Motor Picker */}
      {twins.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-rule" role="tablist">
          <span className="text-sm text-mute mr-1">Motors:</span>
          {twins.map(t => {
            const isSel = t.motorId === selectedMotorId;
            const tOk = t.operationalState === 'HEALTHY';
            const tDot = tOk ? 'bg-ok' : (t.operationalState === 'WARNING' ? 'bg-warn' : 'bg-bad');
            return (
              <button
                key={t.motorId}
                role="tab"
                aria-selected={isSel}
                onClick={() => setSelectedMotorId(t.motorId)}
                className={`min-h-[44px] px-4 py-2 rounded-full border text-sm font-medium inline-flex items-center gap-2 transition-colors ${
                  isSel ? 'border-ink bg-ink text-bg font-semibold' : 'border-rule bg-panel text-ink hover:border-ink'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${tDot}`} />
                <span>{t.motorId}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Needs Attention */}
      {activeAlerts.length > 0 && (
        <section className="p-4 border-l-4 border-bad bg-panel rounded space-y-3">
          <h2 className="text-base font-semibold text-bad flex items-center gap-2">
            <span>Needs attention</span>
            <span className="text-xs px-2 py-0.5 rounded-full border border-bad text-bad">{activeAlerts.length}</span>
          </h2>
          {activeAlerts.map(alert => (
            <div key={alert.id} className="pt-2 border-t border-rule/60 first:border-t-0 first:pt-0 space-y-2">
              <p className="font-semibold text-ink text-sm">{alert.title}</p>
              <p className="text-xs text-mute">{alert.description}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => api.acknowledgeAlert(alert.id, noteMap[alert.id]).then(fetchData)}
                  className="min-h-[44px] px-3 py-1.5 rounded border border-rule bg-bg text-ink hover:border-ink text-xs font-medium"
                >
                  I've seen this
                </button>
                <button
                  onClick={() => api.resolveAlert(alert.id, noteMap[alert.id]).then(fetchData)}
                  className="min-h-[44px] px-3 py-1.5 rounded border border-ok bg-ok text-bg hover:opacity-90 text-xs font-medium"
                >
                  It's fixed
                </button>
                <button
                  onClick={() => setShowNoteField(p => ({ ...p, [alert.id]: !p[alert.id] }))}
                  className="min-h-[44px] px-2 text-xs text-mute hover:text-ink underline"
                >
                  {showNoteField[alert.id] ? 'Hide note' : 'Add a note'}
                </button>
              </div>
              {showNoteField[alert.id] && (
                <input
                  type="text"
                  placeholder="Optional operator note..."
                  value={noteMap[alert.id] || ''}
                  onChange={e => setNoteMap({ ...noteMap, [alert.id]: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded border border-rule bg-bg text-ink text-xs"
                />
              )}
            </div>
          ))}
        </section>
      )}

      {/* 3. Hero */}
      <section className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
        <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="42" className="text-rule stroke-current" strokeWidth="8" fill="transparent" />
            <circle
              cx="50" cy="50" r="42" stroke={ringColor} strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={strokeOffset}
              strokeLinecap="round" fill="transparent" className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-2xl font-bold text-ink">{healthScore}</span>
            <span className="text-[11px] text-mute uppercase font-mono">Health</span>
          </div>
        </div>

        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl text-ink font-normal leading-tight">{plainInfo.verdict}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full border font-medium" style={{ borderColor: ringColor, color: ringColor }}>
              {statusWord}
            </span>
            {simStatus?.isRunning && <span className="text-xs px-2 py-0.5 rounded bg-rule/50 text-mute">Simulated data</span>}
          </div>
          <p className="text-mute text-base leading-relaxed">{plainInfo.explanation}</p>
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-rule text-sm">
            <div>
              <span className="block text-xs text-mute">How sure</span>
              <span className="font-mono font-medium text-ink">
                {activeTwin.confidence != null ? `${Math.round(activeTwin.confidence * 100)}%` : '–'}
              </span>
            </div>
            <div>
              <span className="block text-xs text-mute">Time left</span>
              <span className="font-mono font-medium text-ink">
                {activeTwin.estimatedRulHours != null ? `${activeTwin.estimatedRulHours.toFixed(1)} h` : 'Not available'}
              </span>
            </div>
            <div>
              <span className="block text-xs text-mute">Updated</span>
              <span className="text-xs font-mono text-ink">{formatRelativeTime(activeTwin.lastUpdated)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Why We Think So */}
      {top4.length > 0 && (
        <section className="space-y-3 pt-4 border-t border-rule">
          <h2 className="text-lg font-serif">Why we think so</h2>
          <p className="text-sm text-mute">{attributionSentence}</p>
          <div className="space-y-2 pt-1">
            {top4.map((attr, idx) => {
              const friendlyName = getFriendlyFeatureName(attr.feature_name);
              const isConcern = attr.direction === 'INCREASES_RISK' || (attr.shap_value || 0) > 0;
              const barWidth = Math.min(100, Math.max(12, Math.round(Math.abs(attr.shap_value || attr.percentage_contribution || 0) * 100)));
              return (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 p-2.5 rounded bg-panel">
                  <span className="text-sm font-medium text-ink flex-1">{friendlyName}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 sm:w-32 bg-rule/60 h-2 rounded overflow-hidden" aria-hidden="true">
                      <div className="h-full rounded" style={{ width: `${barWidth}%`, backgroundColor: isConcern ? 'var(--bad)' : 'var(--ok)' }} />
                    </div>
                    <span className={`text-xs font-medium min-w-[95px] text-right ${isConcern ? 'text-bad' : 'text-ok'}`}>
                      {isConcern ? 'raises concern' : 'lowers concern'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. What To Do */}
      <section className="space-y-3 pt-4 border-t border-rule">
        <h2 className="text-lg font-serif">What to do</h2>
        {activeTwin.latestMaintenanceRecommendation?.suggestedActions?.length ? (
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-ink pl-1">
            {activeTwin.latestMaintenanceRecommendation.suggestedActions.map((act, i) => (
              <li key={i} className="leading-relaxed">{act}</li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-mute">No immediate action needed. Continue routine monitoring.</p>
        )}
        <details className="text-xs text-mute pt-1 cursor-pointer">
          <summary className="hover:text-ink font-medium select-none">Safety note</summary>
          <p className="p-3 mt-2 rounded bg-panel border border-rule text-xs leading-relaxed">
            {activeTwin.latestMaintenanceRecommendation?.safetyDisclaimer ||
              'Follow lockout/tagout procedures before inspecting electrical components or bearings. MACHINA-X provides advisory decision support and does not actuate plant circuit breakers.'}
          </p>
        </details>
      </section>

      {/* 6. Trend */}
      <section className="space-y-3 pt-4 border-t border-rule">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif">Trend</h2>
          <div className="inline-flex rounded border border-rule p-0.5 bg-panel text-xs" role="tablist">
            {(['vibration', 'current', 'temperature'] as const).map(tab => (
              <button
                key={tab}
                role="tab"
                aria-selected={trendTab === tab}
                onClick={() => setTrendTab(tab)}
                className={`min-h-[36px] px-3 py-1 rounded capitalize transition-colors ${
                  trendTab === tab ? 'bg-ink text-bg font-medium' : 'text-mute hover:text-ink'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        {points.length > 1 ? (
          <div className="p-4 rounded bg-panel border border-rule space-y-2">
            <div className="w-full h-28">{renderSvgSparkline(points)}</div>
            <div className="flex justify-between text-xs text-mute font-mono">
              <span>Oldest (30s ago)</span>
              <span>Latest</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-mute">Collecting telemetry trend data...</p>
        )}
      </section>

      {/* 7. Try A Demo */}
      <div ref={demoRef} id="demo-section" className="pt-4 border-t border-rule">
        {renderDemoBox(simStatus, demoFault, setDemoFault, demoSeverity, setDemoSeverity, demoStarting, handleToggleDemo, false)}
      </div>

      {/* 8. Technical Details */}
      <details className="pt-4 border-t border-rule text-xs cursor-pointer">
        <summary className="font-mono text-mute hover:text-ink uppercase tracking-wider select-none">Technical details</summary>
        <div className="p-4 mt-3 rounded bg-panel border border-rule space-y-3 font-mono text-xs text-mute">
          <div>
            <span className="block text-ink font-semibold mb-1">Model State</span>
            <p>Original Fault Class: {activeTwin.predictedFaultClass || 'HEALTHY'}</p>
            <p>Anomaly Score: {activeTwin.anomalyScore != null ? activeTwin.anomalyScore.toFixed(4) : '–'}</p>
            <p>Model Engine: Stage 1 Isolation Forest + Stage 2 XGBoost (TreeSHAP)</p>
          </div>
          {activeTwin.classProbabilities && (
            <div>
              <span className="block text-ink font-semibold mb-1">Class Probabilities</span>
              <ul className="space-y-0.5">
                {Object.entries(activeTwin.classProbabilities).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span>{k}:</span>
                    <span className="text-ink">{(v * 100).toFixed(2)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {topAttrs.length > 0 && (
            <div>
              <span className="block text-ink font-semibold mb-1">Attribution Values</span>
              <ul className="space-y-0.5">
                {topAttrs.map((a, i) => (
                  <li key={i} className="flex justify-between">
                    <span className="truncate pr-2">{a.feature_name}:</span>
                    <span className="text-ink">{(a.shap_value ?? a.feature_value)?.toFixed(4)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
    </div>
  );
};

function renderSvgSparkline(data: number[]) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = 10 + (i / (data.length - 1)) * 580;
    const y = 100 - ((v - min) / range) * 90;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg className="w-full h-full overflow-visible" viewBox="0 0 600 110" preserveAspectRatio="none">
      <polyline fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function renderDemoBox(
  simStatus: SimulatorStatus | null,
  fault: string, setFault: (f: string) => void,
  sev: number, setSev: (s: number) => void,
  starting: boolean, toggle: () => Promise<void>,
  open: boolean
) {
  const faults = [
    { label: 'Healthy', val: 'HEALTHY' },
    { label: 'Bearing wear', val: 'BEARING_DEFECT' },
    { label: 'Rotor bar crack', val: 'BROKEN_ROTOR_BAR' },
    { label: 'Winding short', val: 'STATOR_INTER_TURN_SHORT' },
    { label: 'Rotor misalignment', val: 'AIR_GAP_ECCENTRICITY' }
  ];
  const sevs = [{ label: 'Mild (0.35)', val: 0.35 }, { label: 'Medium (0.60)', val: 0.60 }, { label: 'Strong (0.85)', val: 0.85 }];

  const box = (
    <div className="space-y-4 p-4 rounded bg-panel border border-rule">
      <div>
        <span className="block text-sm font-medium text-ink mb-2">1. Choose condition:</span>
        <div className="flex flex-wrap gap-2">
          {faults.map(opt => (
            <button
              key={opt.val} type="button" onClick={() => setFault(opt.val)}
              className={`min-h-[44px] px-3.5 py-2 rounded text-sm transition-colors ${
                fault === opt.val ? 'border border-ink bg-ink text-bg font-medium' : 'border border-rule bg-bg text-ink hover:border-ink'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="block text-sm font-medium text-ink mb-2">2. Choose strength:</span>
        <div className="flex flex-wrap gap-2">
          {sevs.map(opt => (
            <button
              key={opt.val} type="button" onClick={() => setSev(opt.val)}
              className={`min-h-[44px] px-3.5 py-2 rounded text-sm transition-colors ${
                sev === opt.val ? 'border border-ink bg-ink text-bg font-medium' : 'border border-rule bg-bg text-ink hover:border-ink'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-rule">
        <span className="text-xs text-mute">Motor load is fixed at 75%.</span>
        <button
          type="button" disabled={starting} onClick={toggle}
          className={`min-h-[44px] px-6 py-2.5 rounded font-medium text-sm transition-colors ${
            simStatus?.isRunning ? 'border border-bad bg-bad text-bg hover:opacity-90' : 'border border-ink bg-ink text-bg hover:opacity-90'
          }`}
        >
          {starting ? 'Updating...' : (simStatus?.isRunning ? 'Stop demo' : 'Start demo')}
        </button>
      </div>
    </div>
  );

  if (open) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-serif">Try a demo</h2>
        <p className="text-sm text-mute">Simulate real operating readings to observe how warnings are generated.</p>
        {box}
      </div>
    );
  }
  return (
    <details className="space-y-3 cursor-pointer">
      <summary className="text-lg font-serif select-none flex items-center justify-between hover:text-mute">
        <span>Try a demo</span>
        {simStatus?.isRunning && <span className="text-xs px-2.5 py-1 rounded bg-bad/15 text-bad font-medium">Demo running</span>}
      </summary>
      <div className="pt-2">{box}</div>
    </details>
  );
}
