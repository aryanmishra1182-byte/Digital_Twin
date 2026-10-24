import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { CsvFieldGuideResponse, CsvAnalysisResponse } from '../types';
import { getPlainInfo, getFriendlyFeatureName } from '../lib/plain';
import { useToast } from '../context/ToastContext';
import {
  Database,
  Upload,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  RefreshCw,
  Play,
} from 'lucide-react';

export const DataLabPage: React.FC = () => {
  const { showToast } = useToast();
  const [mode, setMode] = useState<'motor' | 'ai4i'>('motor');
  const [guide, setGuide] = useState<CsvFieldGuideResponse | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [results, setResults] = useState<CsvAnalysisResponse | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .getCsvFieldGuide(mode)
      .then((g) => setGuide(g))
      .catch(() => setGuide(null));
  }, [mode]);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setErrorMsg('Please select a valid CSV file (.csv).');
      showToast('error', 'Invalid File Format', 'Only .csv files are supported.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.analyzeCsvUpload(mode, file);
      setResults(res);
      showToast('success', 'Analysis Complete', `Successfully processed ${res.valid_rows_count} records.`);
    } catch (err: any) {
      const raw = err?.message || 'Unable to check file.';
      if (raw.includes('Missing required column')) {
        const col = raw.split(':').pop()?.trim() || 'required column';
        setErrorMsg(`The uploaded dataset is missing column: "${col}". Check the Field Guide.`);
      } else if (raw.includes('Row') || raw.includes('row')) {
        setErrorMsg(raw.replace(/Error|Exception|HTTP \d+:/gi, '').trim());
      } else {
        setErrorMsg('The file could not be parsed. Ensure standard UTF-8 CSV formatting with numeric readings.');
      }
      showToast('error', 'Ingestion Failed', 'Schema validation error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleTryExample = async () => {
    if (!guide?.fields) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const headers = guide.fields.map((f) => f.column).join(',');
      const row = guide.fields.map((f) => f.example ?? '0').join(',');
      const csvText = `${headers}\n${row}\n`;
      const blob = new Blob([csvText], { type: 'text/csv' });
      const file = new File([blob], `example_${mode}.csv`, { type: 'text/csv' });
      const res = await api.analyzeCsvUpload(mode, file);
      setResults(res);
      showToast('success', 'Sample Analyzed', `Evaluated sample ${mode.toUpperCase()} dataset.`);
    } catch (err: any) {
      setErrorMsg('Could not run the example dataset. Verify that ML service is reachable.');
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
    a.download = `machina_x_analysis_${mode}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('info', 'File Downloaded', 'Exported analyzed records CSV.');
  };

  return (
    <div className="space-y-6 py-6">
      {/* Top Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-aerospace dark:text-aerospace-bright">
              DATASET INGESTION WORKSPACE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark text-ink-muted">
              BATCH CSV & BENCHMARKS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink dark:text-ink-inverse mt-1">
            Data Lab · Schema Validation & Offline Inference
          </h2>
          <p className="text-xs text-ink-secondary dark:text-ink-muted font-mono mt-0.5">
            Ingest external telemetry streams or UCI AI4I 2020 predictive maintenance benchmark logs.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-panel dark:bg-panel-dark p-1 rounded-lg border border-rule dark:border-rule-dark">
          <button
            type="button"
            onClick={() => {
              setMode('motor');
              setResults(null);
              setErrorMsg(null);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all ${
              mode === 'motor'
                ? 'bg-aerospace text-white shadow-sm'
                : 'text-ink-secondary dark:text-ink-muted hover:text-ink dark:hover:text-ink-inverse'
            }`}
          >
            Induction Motor Telemetry
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('ai4i');
              setResults(null);
              setErrorMsg(null);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all ${
              mode === 'ai4i'
                ? 'bg-aerospace text-white shadow-sm'
                : 'text-ink-secondary dark:text-ink-muted hover:text-ink dark:hover:text-ink-inverse'
            }`}
          >
            UCI AI4I 2020 Benchmark
          </button>
        </div>
      </div>

      {/* Dataset Specification Card */}
      <div className="p-4 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark flex items-center justify-center text-aerospace">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink dark:text-ink-inverse">
              {guide?.name || (mode === 'motor' ? '3-Phase Induction Motor Format' : 'UCI AI4I Benchmark Format')}
            </h3>
            <p className="text-xs text-ink-secondary dark:text-ink-muted mt-0.5">
              {guide?.description || 'Validated schema for automated feature extraction, anomaly screening, and classification.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuideModal(!showGuideModal)}
            className="px-3 py-1.5 rounded-lg border border-rule dark:border-rule-dark text-xs font-mono text-ink-secondary hover:text-ink dark:hover:text-ink-inverse hover:bg-surface-secondary dark:hover:bg-panel-dark-subtle flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showGuideModal ? 'Hide Schema Guide' : 'View Field Guide'}</span>
          </button>
          <button
            type="button"
            onClick={handleTryExample}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark text-xs font-mono text-aerospace font-semibold hover:bg-rule dark:hover:bg-rule-dark transition-colors flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Inject Sample Record</span>
          </button>
        </div>
      </div>

      {/* Collapsible Schema Field Guide Drawer */}
      {showGuideModal && guide?.fields && (
        <div className="p-4 sm:p-5 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark animate-in fade-in space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-ink-inverse">
              Expected Column Specifications ({guide.fields.length} Fields)
            </h4>
            <span className="text-[10px] font-mono text-ink-muted">Server-Side Validated</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-rule dark:border-rule-dark text-ink-muted text-[10px] uppercase">
                  <th className="py-2 px-3">Column Name</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Unit</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Required</th>
                  <th className="py-2 px-3">Valid Range</th>
                  <th className="py-2 px-3">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/60 dark:divide-rule-dark/60 text-ink dark:text-ink-inverse">
                {guide.fields.map((f, i) => (
                  <tr key={f.column || i} className="hover:bg-surface-secondary/50 dark:hover:bg-panel-dark-subtle">
                    <td className="py-2 px-3 font-bold text-aerospace">{f.column}</td>
                    <td className="py-2 px-3 font-sans text-ink-secondary dark:text-ink-muted text-[11px]">{f.description}</td>
                    <td className="py-2 px-3 text-ink-muted">{f.unit || '–'}</td>
                    <td className="py-2 px-3 text-[10px]">{f.type}</td>
                    <td className="py-2 px-3">
                      {f.required ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-state-critical-pale text-state-critical font-bold">YES</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-surface-secondary text-ink-muted">OPT</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-ink-muted text-[10px]">{f.valid_range || '–'}</td>
                    <td className="py-2 px-3 text-state-normal font-semibold">{String(f.example)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      {!results && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileUpload(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`p-8 sm:p-12 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
            isDragOver
              ? 'border-aerospace bg-aerospace/5 dark:bg-aerospace-pale-dark/20'
              : 'border-rule dark:border-rule-dark bg-panel dark:bg-panel-dark hover:border-aerospace/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-full bg-surface-secondary dark:bg-panel-dark-subtle flex items-center justify-center text-aerospace">
            {loading ? (
              <RefreshCw className="w-6 h-6 animate-spin text-aerospace" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-ink dark:text-ink-inverse">
              {loading ? 'Evaluating Dataset against Trained ML Models...' : 'Drop Telemetry CSV File Here'}
            </h3>
            <p className="text-xs text-ink-secondary dark:text-ink-muted mt-1 max-w-sm">
              Click to select or drag and drop a valid CSV file. Files are processed securely through the local ML microservice.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-ink-muted">
            <span className="px-2 py-0.5 rounded bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark">
              Format: .csv
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark">
              Max Size: 25 MB
            </span>
          </div>
        </div>
      )}

      {/* Error Message Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-state-critical-pale text-state-critical border border-state-critical/30 flex items-start gap-3 text-xs font-mono">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Validation Error</span>
            <p className="mt-0.5 text-state-critical/90 font-sans">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Analysis Results View */}
      {results && (
        <div className="space-y-4">
          {/* Results Summary Bar */}
          <div className="p-4 sm:p-5 rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-state-normal" />
                <h3 className="text-base font-bold text-ink dark:text-ink-inverse">
                  Dataset Batch Analysis Report ({results.valid_rows_count} / {results.total_rows_received} Valid Rows)
                </h3>
              </div>
              <p className="text-xs text-ink-secondary dark:text-ink-muted font-mono mt-0.5">
                Model: {mode === 'motor' ? 'XGBoost 3kW Motor Pipeline' : 'RandomForest AI4I Benchmark'} · TreeSHAP Attributed
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadResults}
                className="px-4 py-2 rounded-lg bg-aerospace text-white text-xs font-mono font-semibold hover:bg-aerospace-bright transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Analyzed CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setResults(null);
                  setErrorMsg(null);
                }}
                className="px-3 py-2 rounded-lg border border-rule dark:border-rule-dark bg-surface-secondary dark:bg-panel-dark-subtle text-xs font-mono text-ink dark:text-ink-inverse hover:bg-rule dark:hover:bg-rule-dark transition-colors"
              >
                Analyze Another File
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="rounded-xl bg-panel dark:bg-panel-dark border border-rule dark:border-rule-dark overflow-hidden">
            <div className="p-3 border-b border-rule dark:border-rule-dark flex items-center justify-between text-xs font-mono text-ink-muted">
              <span>ANALYZED RECORDS</span>
              <span>Click any row for SHAP driver details</span>
            </div>

            <div className="divide-y divide-rule dark:divide-rule-dark">
              {results.analysis_results.map((row) => {
                const isExpanded = expandedRow === row.row_index;
                const isCritical = row.risk_level === 'CRITICAL';
                const isHigh = row.risk_level === 'HIGH' || row.risk_level === 'MEDIUM';

                return (
                  <div
                    key={row.row_index}
                    className="p-4 hover:bg-surface-secondary/40 dark:hover:bg-panel-dark-subtle cursor-pointer transition-colors"
                    onClick={() => setExpandedRow(isExpanded ? null : row.row_index)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-ink-muted w-14">
                          Row #{row.row_index}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCritical ? 'bg-state-critical' : isHigh ? 'bg-state-warning' : 'bg-state-normal'
                            }`}
                          />
                          <span className="font-semibold text-sm text-ink dark:text-ink-inverse">
                            {row.predicted_condition}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold uppercase ${
                            isCritical
                              ? 'bg-state-critical-pale text-state-critical border border-state-critical/30'
                              : isHigh
                              ? 'bg-state-warning-pale text-state-warning border border-state-warning/30'
                              : 'bg-state-normal-pale text-state-normal border border-state-normal/30'
                          }`}
                        >
                          {row.risk_level} RISK
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-ink-muted" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-ink-muted" />
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-ink-secondary dark:text-ink-muted mt-1.5 font-sans">
                      {row.recommended_action}
                    </p>

                    {/* Expanded SHAP Drivers */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-rule dark:border-rule-dark text-xs font-mono space-y-2">
                        {row.top_shap_driver && (
                          <div className="p-2.5 rounded bg-surface-secondary dark:bg-panel-dark-subtle border border-rule dark:border-rule-dark">
                            <span className="text-ink-muted block text-[10px] uppercase font-bold">
                              Key Predictive Driver (SHAP):
                            </span>
                            <span className="font-semibold text-aerospace dark:text-aerospace-bright">
                              {getFriendlyFeatureName(row.top_shap_driver)}
                            </span>
                          </div>
                        )}
                        {row.failure_probability != null && (
                          <div className="text-ink-muted text-[11px]">
                            Failure Probability: <span className="font-bold text-ink dark:text-ink-inverse">{(row.failure_probability * 100).toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
