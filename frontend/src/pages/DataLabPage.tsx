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
    <div className="space-y-4 py-4">
      {/* Top Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Data Lab — Batch Ingestion & Benchmarks
            </h2>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#0B202C] text-[#9B6DCC] border border-[#1C3B4E]">
              CSV INGESTION
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
            Offline Telemetry Batch Validation · UCI AI4I 2020 Predictive Maintenance Benchmark Ingestion
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-[#0B202C] p-1 rounded border border-[#1C3B4E]">
          <button
            type="button"
            onClick={() => {
              setMode('motor');
              setResults(null);
              setErrorMsg(null);
            }}
            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
              mode === 'motor'
                ? 'bg-[#68409A] text-white shadow-xs'
                : 'text-[#94A3B8] hover:text-white'
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
            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
              mode === 'ai4i'
                ? 'bg-[#68409A] text-white shadow-xs'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            UCI AI4I Benchmark
          </button>
        </div>
      </div>

      {/* Dataset Specification Card */}
      <div className="rounded-md bg-white border border-[#E2E8F0] p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#355D8B]">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#253746]">
              {guide?.name || (mode === 'motor' ? '3-Phase Induction Motor Format' : 'UCI AI4I Benchmark Format')}
            </h3>
            <p className="text-xs text-[#718096] mt-0.5">
              {guide?.description || 'Validated schema for automated feature extraction, anomaly screening, and classification.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuideModal(!showGuideModal)}
            className="px-2.5 py-1 rounded border border-[#E2E8F0] text-xs font-mono text-[#718096] hover:text-[#253746] hover:bg-[#F8FAFC] flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showGuideModal ? 'Hide Schema Guide' : 'View Field Guide'}</span>
          </button>
          <button
            type="button"
            onClick={handleTryExample}
            disabled={loading}
            className="px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono text-[#355D8B] font-semibold hover:bg-[#E2E8F0] transition-colors flex items-center gap-1.5"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Inject Sample Record</span>
          </button>
        </div>
      </div>

      {/* Collapsible Schema Field Guide Drawer */}
      {showGuideModal && guide?.fields && (
        <div className="rounded-md bg-white border border-[#E2E8F0] p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#253746]">
              Expected Column Specifications ({guide.fields.length} Fields)
            </h4>
            <span className="text-[10px] font-mono text-[#718096]">Server-Side Validated</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#718096] text-[10px] uppercase">
                  <th className="py-2 px-3">Column Name</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Unit</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Required</th>
                  <th className="py-2 px-3">Valid Range</th>
                  <th className="py-2 px-3">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#253746]">
                {guide.fields.map((f, i) => (
                  <tr key={f.column || i} className="hover:bg-[#F8FAFC]">
                    <td className="py-2 px-3 font-bold text-[#355D8B]">{f.column}</td>
                    <td className="py-2 px-3 font-sans text-[#718096] text-[11px]">{f.description}</td>
                    <td className="py-2 px-3 text-[#718096]">{f.unit || '–'}</td>
                    <td className="py-2 px-3 text-[10px]">{f.type}</td>
                    <td className="py-2 px-3">
                      {f.required ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#C94B50]/15 text-[#C94B50] font-bold">YES</span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#F8FAFC] text-[#718096]">OPT</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[#718096] text-[10px]">{f.valid_range || '–'}</td>
                    <td className="py-2 px-3 text-[#27866F] font-semibold">{String(f.example)}</td>
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
          className={`p-8 rounded-md border-2 border-dashed text-center cursor-pointer transition-all bg-white shadow-sm ${
            isDragOver
              ? 'border-[#68409A] bg-[#F3EBF9]/30'
              : 'border-[#CBD5E1] hover:border-[#68409A]/60 hover:bg-[#F8FAFC]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
          <Upload className="w-8 h-8 text-[#355D8B] mx-auto mb-2 opacity-80" />
          <h3 className="text-sm font-semibold text-[#253746]">
            Upload {mode === 'motor' ? 'Motor Telemetry' : 'AI4I Benchmark'} CSV
          </h3>
          <p className="text-xs text-[#718096] max-w-md mx-auto mt-1">
            Drag and drop your dataset here, or click to browse. Strict validation ensures zero missing columns or non-numeric entries.
          </p>
          <span className="inline-block mt-3 px-3 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono text-[#355D8B] font-semibold">
            {loading ? 'Validating schema...' : 'Select .CSV File'}
          </span>
        </div>
      )}

      {/* Validation / Parsing Error Message Banner */}
      {errorMsg && (
        <div className="p-3.5 rounded-md bg-[#C94B50]/10 border border-[#C94B50]/30 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#C94B50] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-[#C94B50] block">Dataset Validation Error:</span>
            <p className="text-[#C94B50] mt-0.5 leading-relaxed font-mono">{errorMsg}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-xs font-mono text-[#C94B50] hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Analysis Results View */}
      {results && (
        <div className="space-y-3.5 animate-in fade-in">
          {/* Summary KPI Strip */}
          <div className="p-4 rounded-md bg-white border border-[#E2E8F0] shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#718096] block">
                Batch Validation Verdict
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-[#27866F]" />
                <h3 className="text-base font-bold text-[#253746]">
                  {results.valid_rows_count} Rows Validated & Inferred
                </h3>
              </div>
              <p className="text-xs text-[#718096] font-mono mt-0.5">
                Target: {results.mode.toUpperCase()} · Anomaly Rate:{' '}
                {results.valid_rows_count > 0
                  ? ((results.analysis_results.filter((r) => r.is_anomaly).length / results.valid_rows_count) * 100).toFixed(1)
                  : '0.0'}%
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadResults}
                className="px-3 py-1.5 rounded bg-[#355D8B] text-white text-xs font-mono font-semibold hover:bg-[#355D8B]/90 transition-colors flex items-center gap-1.5 shadow-xs"
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
                className="px-3 py-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono text-[#718096] hover:text-[#253746] transition-colors"
              >
                Upload Another File
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="rounded-md bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="h-9 px-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
              <h4 className="font-mono text-xs font-bold text-[#253746] uppercase tracking-wider">
                Inference Records ({results.analysis_results.length} Displayed)
              </h4>
              <span className="text-[10px] font-mono text-[#718096]">
                Click row to inspect local TreeSHAP attributions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#718096] text-[10px] uppercase bg-[#FAFCFE]">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Diagnostic Verdict</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3">Anomaly Status</th>
                    <th className="py-2.5 px-3">Estimated RUL</th>
                    <th className="py-2.5 px-3">Top SHAP Feature</th>
                    <th className="py-2.5 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#253746]">
                  {results.analysis_results.map((rec) => {
                    const isExpanded = expandedRow === rec.row_index;
                    const isHealthy =
                      rec.risk_level === 'LOW' ||
                      rec.predicted_condition.toLowerCase().includes('healthy') ||
                      rec.predicted_condition.toLowerCase().includes('no failure');
                    const info = getPlainInfo(rec.predicted_condition);

                    return (
                      <React.Fragment key={rec.row_index}>
                        <tr
                          onClick={() => setExpandedRow(isExpanded ? null : rec.row_index)}
                          className={`cursor-pointer transition-colors ${
                            isExpanded ? 'bg-[#F3EBF9]/40' : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <td className="py-2 px-3 text-[#718096]">{rec.row_index}</td>
                          <td className="py-2 px-3 font-semibold">
                            <span className={isHealthy ? 'text-[#27866F]' : 'text-[#C94B50]'}>
                              {info.verdict || rec.predicted_condition}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-bold text-[#355D8B]">
                            {rec.confidence != null
                              ? `${(rec.confidence * 100).toFixed(1)}%`
                              : rec.failure_probability != null
                              ? `${(rec.failure_probability * 100).toFixed(1)}%`
                              : '–'}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                rec.is_anomaly
                                  ? 'bg-[#C94B50]/15 text-[#C94B50]'
                                  : 'bg-[#27866F]/15 text-[#27866F]'
                              }`}
                            >
                              {rec.is_anomaly ? 'FLAGGED' : 'NOMINAL'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[#718096]">
                            {rec.estimated_rul_hours != null ? `${rec.estimated_rul_hours.toFixed(1)} hrs` : '–'}
                          </td>
                          <td className="py-2 px-3 text-[#718096]">
                            {rec.top_shap_driver ? getFriendlyFeatureName(rec.top_shap_driver) : '–'}
                          </td>
                          <td className="py-2 px-3 text-right text-[#718096]">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 inline" /> : <ChevronDown className="w-3.5 h-3.5 inline" />}
                          </td>
                        </tr>

                        {/* Expanded TreeSHAP Attributions Drawer */}
                        {isExpanded && (
                          <tr className="bg-[#FAFCFE]">
                            <td colSpan={7} className="p-4 border-t border-[#E2E8F0]">
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono text-[#718096] uppercase font-bold">
                                    Prescriptive Action & Diagnostics (Row #{rec.row_index})
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                      rec.risk_level === 'CRITICAL'
                                        ? 'bg-[#C94B50]/15 text-[#C94B50] border border-[#C94B50]/30'
                                        : rec.risk_level === 'HIGH' || rec.risk_level === 'MEDIUM'
                                        ? 'bg-[#D99A35]/15 text-[#D99A35] border border-[#D99A35]/30'
                                        : 'bg-[#27866F]/15 text-[#27866F] border border-[#27866F]/30'
                                    }`}
                                  >
                                    {rec.risk_level} RISK
                                  </span>
                                </div>
                                <p className="text-xs text-[#253746]">
                                  <span className="font-semibold text-[#718096]">Action: </span>
                                  {rec.recommended_action}
                                </p>
                                {rec.top_shap_driver && (
                                  <div className="p-2.5 rounded bg-white border border-[#E2E8F0] flex items-center justify-between text-xs">
                                    <span className="text-[#718096]">Key Explanatory Driver (SHAP):</span>
                                    <span className="font-mono font-bold text-[#68409A]">
                                      {getFriendlyFeatureName(rec.top_shap_driver)}
                                    </span>
                                  </div>
                                )}
                                {rec.input_data && Object.keys(rec.input_data).length > 0 && (
                                  <div className="pt-1">
                                    <span className="text-[10px] font-mono text-[#718096] uppercase block mb-1">
                                      Sampled Feature Values:
                                    </span>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                      {Object.entries(rec.input_data).slice(0, 8).map(([k, v]) => (
                                        <div key={k} className="p-1.5 rounded bg-white border border-[#E2E8F0] text-[11px] font-mono">
                                          <span className="text-[#718096] block truncate">{k}</span>
                                          <span className="font-bold text-[#253746]">{typeof v === 'number' ? v.toFixed(2) : String(v)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
