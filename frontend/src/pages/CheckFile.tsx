import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { CsvFieldGuideResponse, CsvAnalysisResponse } from '../types';
import { getPlainInfo, getFriendlyFeatureName } from '../lib/plain';

export const CheckFile: React.FC = () => {
  const [mode, setMode] = useState<'motor' | 'ai4i'>('motor');
  const [guide, setGuide] = useState<CsvFieldGuideResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [results, setResults] = useState<CsvAnalysisResponse | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getCsvFieldGuide(mode)
      .then(g => setGuide(g))
      .catch(() => setGuide(null));
  }, [mode]);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setErrorMsg('Please select a valid CSV file.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.analyzeCsvUpload(mode, file);
      setResults(res);
    } catch (err: any) {
      const raw = err?.message || 'Unable to check file.';
      if (raw.includes('Missing required column')) {
        const col = raw.split(':').pop()?.trim() || 'required column';
        setErrorMsg(`The file is missing ${col}. Please check the required columns.`);
      } else if (raw.includes('Row') || raw.includes('row')) {
        setErrorMsg(raw.replace(/Error|Exception|HTTP \d+:/gi, '').trim());
      } else {
        setErrorMsg('The file could not be read. Please make sure it is a valid CSV with standard numbers.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTryExample = async () => {
    if (!guide?.fields) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const headers = guide.fields.map(f => f.column).join(',');
      const row = guide.fields.map(f => f.example ?? '0').join(',');
      const csvText = `${headers}\n${row}\n`;
      const blob = new Blob([csvText], { type: 'text/csv' });
      const file = new File([blob], `example_${mode}.csv`, { type: 'text/csv' });
      const res = await api.analyzeCsvUpload(mode, file);
      setResults(res);
    } catch {
      setErrorMsg('Could not run the example readings. Please check service status.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResults = () => {
    if (!results?.export_csv_content) return;
    const blob = new Blob([results.export_csv_content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checked_readings_${mode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (results) {
    const total = results.total_rows_received;
    const flagged = results.analysis_results.filter(r => r.risk_level === 'HIGH' || r.risk_level === 'CRITICAL' || r.risk_level === 'MEDIUM').length;
    const summarySentence = flagged > 0
      ? `${total} row${total === 1 ? '' : 's'} checked. ${flagged} need${flagged === 1 ? 's' : ''} attention.`
      : `${total} row${total === 1 ? '' : 's'} checked. All readings look normal.`;

    return (
      <div className="space-y-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rule">
          <div>
            <h1 className="text-2xl font-serif text-ink">{summarySentence}</h1>
            <p className="text-sm text-mute mt-1">Readings evaluated against trained physics models.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadResults}
              className="min-h-[44px] px-4 py-2 rounded border border-ink bg-ink text-bg text-sm font-medium hover:opacity-90"
            >
              Download results (.csv)
            </button>
            <button
              onClick={() => { setResults(null); setErrorMsg(null); }}
              className="min-h-[44px] px-4 py-2 rounded border border-rule bg-bg text-ink text-sm font-medium hover:border-ink"
            >
              Check another file
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {results.analysis_results.map((row) => {
            const isMotor = mode === 'motor';
            const plainInfo = isMotor ? getPlainInfo(row.predicted_condition) : {
              verdict: row.predicted_condition === 'No Failure' ? 'Normal machine operation' : `Possible ${row.predicted_condition}`,
              explanation: row.recommended_action
            };

            const risk = row.risk_level;
            const riskColor = risk === 'CRITICAL' ? 'text-bad border-bad' :
              (risk === 'HIGH' || risk === 'MEDIUM' ? 'text-warn border-warn' : 'text-ok border-ok');
            const riskLabel = risk === 'CRITICAL' ? 'Critical' :
              (risk === 'HIGH' ? 'High' : (risk === 'MEDIUM' ? 'Medium' : 'Low'));

            const isExpanded = expandedRow === row.row_index;

            return (
              <div
                key={row.row_index}
                onClick={() => setExpandedRow(isExpanded ? null : row.row_index)}
                className="p-4 rounded bg-panel border border-rule hover:border-ink/60 transition-colors cursor-pointer space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-mute w-14">Row {row.row_index}</span>
                    <span className="font-serif text-base font-medium text-ink">{plainInfo.verdict}</span>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${riskColor}`}>
                    {riskLabel} risk
                  </span>
                </div>

                <p className="text-sm text-mute">{row.recommended_action}</p>

                {isExpanded && row.top_shap_driver && (
                  <div className="pt-2 border-t border-rule/60 text-xs text-mute flex items-center justify-between">
                    <span>Main reason:</span>
                    <span className="font-medium text-ink">{getFriendlyFeatureName(row.top_shap_driver)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      <div>
        <h1 className="text-2xl font-serif text-ink">Check a file</h1>
        <p className="text-mute text-base mt-1">Upload telemetry readings from a CSV file to check for faults.</p>
      </div>

      <section aria-labelledby="step1-heading" className="space-y-3">
        <h2 id="step1-heading" className="text-sm font-semibold text-ink uppercase tracking-wider font-mono">
          1. What kind of readings?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setMode('motor')}
            className={`min-h-[88px] p-4 rounded text-left border transition-colors ${
              mode === 'motor' ? 'border-ink bg-panel ring-1 ring-ink' : 'border-rule bg-bg hover:border-ink/60'
            }`}
          >
            <span className="block font-serif text-base font-medium text-ink">Induction motor readings</span>
            <span className="block text-xs text-mute mt-1">
              Current and vibration measurements from 3-phase induction motors.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode('ai4i')}
            className={`min-h-[88px] p-4 rounded text-left border transition-colors ${
              mode === 'ai4i' ? 'border-ink bg-panel ring-1 ring-ink' : 'border-rule bg-bg hover:border-ink/60'
            }`}
          >
            <span className="block font-serif text-base font-medium text-ink">Factory machine readings</span>
            <span className="block text-xs text-mute mt-1">
              Torque, temperature and tool wear from industrial CNC milling machinery.
            </span>
          </button>
        </div>
      </section>

      <section aria-labelledby="step2-heading" className="space-y-4">
        <h2 id="step2-heading" className="text-sm font-semibold text-ink uppercase tracking-wider font-mono">
          2. Add your file
        </h2>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
          }}
          className="border-2 border-dashed border-rule hover:border-ink rounded-lg p-8 text-center cursor-pointer bg-panel transition-colors space-y-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            }}
          />
          <p className="font-serif text-lg text-ink font-normal">
            {loading ? 'Checking readings...' : 'Drop your CSV file here, or click to browse'}
          </p>
          <p className="text-xs text-mute">Accepts standard .csv files with column headers.</p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded border border-bad/40 bg-bad/10 text-bad text-sm" role="alert">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <a
            href={`/ml-api/csv/templates/${mode}`}
            download
            className="text-mute hover:text-ink underline min-h-[44px] inline-flex items-center"
          >
            Download a template
          </a>

          <button
            type="button"
            disabled={loading}
            onClick={handleTryExample}
            className="min-h-[44px] px-4 py-2 rounded border border-rule bg-panel hover:border-ink text-ink font-medium transition-colors"
          >
            Try an example
          </button>
        </div>

        {guide?.fields && (
          <details className="text-xs text-mute pt-2 cursor-pointer">
            <summary className="hover:text-ink select-none font-medium">What columns do I need?</summary>
            <div className="p-4 mt-2 rounded bg-panel border border-rule space-y-2">
              <p className="text-ink font-medium">{guide.description}</p>
              <div className="max-h-60 overflow-y-auto space-y-1 pt-1 font-mono text-[11px]">
                {guide.fields.map(f => (
                  <div key={f.column} className="flex justify-between py-0.5 border-b border-rule/30">
                    <span className="text-ink font-semibold">{f.column}</span>
                    <span className="text-mute">{f.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </details>
        )}
      </section>
    </div>
  );
};
