import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';
import {
  CsvFieldGuideResponse,
  CsvFieldGuideItem,
  CsvAnalysisResponse,
  CsvAnalysisRowResult
} from '../types';
import { SectionHeader } from '../components/ui/SectionHeader';

export const CsvAnalysis: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'ai4i' | 'motor'>('ai4i');
  const [fieldGuide, setFieldGuide] = useState<CsvFieldGuideResponse | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [results, setResults] = useState<CsvAnalysisResponse | null>(null);
  const [textMode, setTextMode] = useState(false);
  const [rawText, setRawText] = useState('');

  // Sample quick-load presets for easy operator testing
  const sampleAi4iRows = `Air_temperature_K,Process_temperature_K,Rotational_speed_rpm,Torque_Nm,Tool_wear_min,Type
298.1,308.6,1551,42.8,0,M
298.2,308.7,1408,46.3,3,L
298.8,308.9,2861,4.6,143,H
300.7,311.6,1347,78.6,215,M
298.5,308.2,1282,60.7,202,L`;

  const sampleMotorRows = `current_rms,current_fundamental_amp,current_dominant_freq,current_thd,current_harm_3_ratio,current_harm_5_ratio,brb_left_sideband_amp,brb_right_sideband_amp,brb_sideband_ratio,eccentricity_sideband_amp,vib_rms,vib_std,vib_peak,vib_peak_to_peak,vib_crest_factor,vib_kurtosis,vib_skewness,vib_bpfo_energy,vib_bpfi_energy,vib_1x_shaft_amp,temp_mean,temp_max,temp_rate_of_rise,load_pct,estimated_speed_rpm,estimated_slip
5.2,7.3,50.0,0.021,0.015,0.008,0.02,0.02,0.005,0.03,0.45,0.44,1.4,2.8,3.1,2.9,0.05,0.012,0.010,0.35,48.2,49.1,0.02,75.0,1445.0,0.036
6.8,9.5,50.0,0.085,0.045,0.032,0.65,0.58,0.095,0.08,0.72,0.70,2.3,4.6,3.2,3.1,0.12,0.018,0.015,0.48,58.5,60.2,0.08,100.0,1432.0,0.045
5.9,8.1,50.0,0.065,0.028,0.142,0.08,0.07,0.012,0.05,0.55,0.53,1.8,3.6,3.2,3.0,0.08,0.014,0.011,0.40,68.4,72.1,0.22,75.0,1440.0,0.040
5.1,7.2,50.0,0.025,0.016,0.009,0.03,0.03,0.006,0.04,1.85,1.82,8.4,16.8,4.5,6.8,0.85,0.450,0.120,0.65,52.1,53.4,0.04,75.0,1448.0,0.034
5.4,7.6,50.0,0.038,0.022,0.012,0.04,0.04,0.007,0.38,1.25,1.22,4.8,9.6,3.8,4.2,0.25,0.035,0.028,1.15,50.4,51.8,0.03,75.0,1442.0,0.038`;

  // Fetch field guide on mode change
  useEffect(() => {
    setFieldGuide(null);
    setErrorMsg(null);
    setResults(null);
    setSelectedFile(null);
    setFilePreview('');
    setRawText('');

    api.getCsvFieldGuide(activeMode)
      .then((res) => setFieldGuide(res))
      .catch((err) => console.error("Field guide load error:", err));
  }, [activeMode]);

  const handleDownloadTemplate = () => {
    const url = `/ml-api/csv/templates/${activeMode}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeMode}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFilePreview(text.slice(0, 500) + (text.length > 500 ? '\n... (truncated preview)' : ''));
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv') || file.type === 'text/csv' || file.name.endsWith('.txt')) {
        handleFileSelect(file);
      } else {
        setErrorMsg('Please select a valid CSV file.');
      }
    }
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setResults(null);

    try {
      let res: CsvAnalysisResponse;
      if (textMode) {
        if (!rawText.trim()) {
          setErrorMsg('Please paste CSV content to analyze.');
          setIsAnalyzing(false);
          return;
        }
        res = await api.analyzeCsvText(activeMode, rawText);
      } else {
        if (!selectedFile) {
          setErrorMsg('Please upload a CSV file to analyze.');
          setIsAnalyzing(false);
          return;
        }
        res = await api.analyzeCsvUpload(activeMode, selectedFile);
      }
      setResults(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis failed. Check your CSV format against the Field Guide.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportEnrichedCsv = () => {
    if (!results || !results.export_csv_content) return;
    const blob = new Blob([results.export_csv_content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeMode}_analyzed_results_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadSample = () => {
    setTextMode(true);
    if (activeMode === 'ai4i') {
      setRawText(sampleAi4iRows);
    } else {
      setRawText(sampleMotorRows);
    }
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Offline Batch CSV Diagnostic Analysis"
        subtitle="Ingest raw machine telemetry or pre-extracted vibration/current features to perform batch anomaly detection, fault classification, and SHAP explainability."
        tag="Batch Diagnostics"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="px-3 py-1.5 rounded bg-surface hover:bg-surface-elevated text-slate-300 border border-panel-border text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-brand-400" />
              <span>Load Sample CSV</span>
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-1.5 rounded-md bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs inline-flex items-center gap-1.5 shadow-subtle transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Blank Template</span>
            </button>
          </div>
        }
      />

      {/* Mode Selector Tabs */}
      <div className="bg-panel border border-panel-border rounded-lg p-1.5 flex gap-1.5">
        <button
          onClick={() => setActiveMode('ai4i')}
          className={`flex-1 py-2.5 px-4 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-2 ${
            activeMode === 'ai4i'
              ? 'bg-brand-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-surface/50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Mode 1: UCI AI4I 2020 Benchmark (6 Input Columns)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 uppercase font-mono">
            Binary + SHAP
          </span>
        </button>

        <button
          onClick={() => setActiveMode('motor')}
          className={`flex-1 py-2.5 px-4 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-2 ${
            activeMode === 'motor'
              ? 'bg-brand-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-surface/50'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Mode 2: Induction Motor Physical Features (26 Features)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 uppercase font-mono">
            5-Class + RUL
          </span>
        </button>
      </div>

      {/* Mode Description & Field Guide Accordion */}
      <div className="bg-panel border border-panel-border rounded-lg overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-panel-border/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">
                {activeMode === 'ai4i' ? 'UCI AI4I 2020 Physical Variable Ingestion' : 'Three-Phase Motor MCSA & Vibration Telemetry'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-panel-border text-brand-400">
                {activeMode === 'ai4i' ? '6 Features Required' : '26 Features Required'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {activeMode === 'ai4i'
                ? 'Evaluates factory machine variables (temperatures, spindle RPM, torque, tool wear) against the 98.45% accurate XGBoost benchmark model.'
                : 'Evaluates pre-extracted electrical and mechanical features (MCSA sidebands, BPFO/BPFI energies, crest factor, thermal rise) for 5-class fault diagnosis.'}
            </p>
          </div>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="px-3 py-1.5 rounded bg-surface hover:bg-surface-elevated text-slate-300 border border-panel-border text-xs font-medium inline-flex items-center gap-1.5 transition-colors self-start md:self-auto"
          >
            <Info className="w-3.5 h-3.5 text-brand-400" />
            <span>{showGuide ? 'Hide Schema Guide' : 'View Schema Field Guide'}</span>
            {showGuide ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        </div>

        {/* Collapsible Schema Guide Table */}
        {showGuide && fieldGuide && (
          <div className="p-4 bg-surface/30 overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-panel-border text-slate-400 font-mono text-[11px]">
                  <th className="pb-2 font-medium">Column Header</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Unit</th>
                  <th className="pb-2 font-medium">Data Type</th>
                  <th className="pb-2 font-medium">Valid Range</th>
                  <th className="pb-2 font-medium">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-border/40 font-mono text-[11px]">
                {fieldGuide.fields.map((f, i) => (
                  <tr key={i} className="hover:bg-surface/50">
                    <td className="py-2 font-semibold text-brand-300">{f.column}</td>
                    <td className="py-2 text-slate-300 font-sans">{f.description}</td>
                    <td className="py-2 text-slate-400">{f.unit}</td>
                    <td className="py-2 text-slate-400">{f.type}</td>
                    <td className="py-2 text-amber-300/80">{f.valid_range}</td>
                    <td className="py-2 text-emerald-400">{String(f.example)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Input Selector: Drag & Drop or Raw Paste */}
      <div className="bg-panel border border-panel-border rounded-lg p-5">
        <div className="flex items-center justify-between pb-3 border-b border-panel-border/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">Input Method</span>
            <div className="flex rounded bg-surface p-0.5 border border-panel-border">
              <button
                onClick={() => setTextMode(false)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  !textMode ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                File Upload (.csv)
              </button>
              <button
                onClick={() => setTextMode(true)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  textMode ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Paste CSV Text
              </button>
            </div>
          </div>

          <span className="text-xs text-slate-400">
            {textMode ? 'Direct text stream' : 'Supports standard UTF-8 CSV'}
          </span>
        </div>

        <div className="mt-4">
          {!textMode ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                isDragging
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-panel-border hover:border-slate-500 bg-surface/20'
              }`}
            >
              <UploadCloud className="w-10 h-10 text-brand-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-200">
                Drag and drop your telemetry CSV file here, or{' '}
                <label className="text-brand-400 hover:text-brand-300 underline cursor-pointer">
                  browse files
                  <input
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                CSV files must include column headers matching the field guide.
              </p>

              {selectedFile && (
                <div className="mt-4 p-3 bg-surface rounded border border-panel-border inline-flex items-center gap-3 text-left">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste CSV rows here including header row..."
                rows={7}
                className="w-full bg-surface/40 border border-panel-border rounded-md p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Validation checks missing headers, non-numeric values, and boundary ranges before inference.
          </span>
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing || (!selectedFile && !rawText.trim())}
            className={`px-5 py-2.5 rounded-md font-medium text-xs inline-flex items-center gap-2 shadow-subtle transition-all ${
              isAnalyzing || (!selectedFile && !rawText.trim())
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-brand-600 hover:bg-brand-500 text-white'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Validating & Inferencing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute Batch Diagnostics</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message Card */}
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-rose-300 block">Diagnostic Ingestion Error</span>
            <p className="text-rose-200/90 mt-1 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Validation Errors Table (if any rows were rejected) */}
      {results && results.validation_errors && results.validation_errors.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-300">
              {results.validation_errors.length} Row(s) Rejected During Pre-Inference Validation
            </span>
          </div>
          <p className="text-xs text-amber-200/80 mb-3">
            The following rows did not conform to schema requirements and were omitted from inference:
          </p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-[11px]">
            {results.validation_errors.map((err, idx) => (
              <div key={idx} className="bg-surface/60 p-2 rounded border border-panel-border/50 text-slate-300">
                <span className="text-amber-400 font-bold mr-2">Row {err.row_index}:</span>
                {err.column && <span className="text-brand-300 mr-2">[{err.column}]</span>}
                <span className="text-slate-300">{err.error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyzed Results Table */}
      {results && results.analysis_results && (
        <div className="bg-panel border border-panel-border rounded-lg overflow-hidden">
          <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-panel-border/60">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">
                  Batch Inference Completed ({results.analysis_results.length} Rows Processed)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Model: {results.mode === 'ai4i' ? 'XGBoost 98.45% AI4I Champion' : 'XGBoost 94.55% 5-Class Classifier'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Each row has been processed through anomaly detection, classifier inference, and SHAP feature attribution.
              </p>
            </div>

            <button
              onClick={handleExportEnrichedCsv}
              className="px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs inline-flex items-center gap-1.5 shadow-subtle transition-colors self-start md:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Analyzed Results CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface/50 border-b border-panel-border text-slate-400 font-mono text-[11px]">
                  <th className="py-2.5 px-4 font-medium">Row</th>
                  <th className="py-2.5 px-4 font-medium">Predicted Condition</th>
                  <th className="py-2.5 px-4 font-medium">
                    {results.mode === 'ai4i' ? 'Failure Probability' : 'Classification Confidence'}
                  </th>
                  <th className="py-2.5 px-4 font-medium">Risk Level</th>
                  <th className="py-2.5 px-4 font-medium">
                    {results.mode === 'ai4i' ? 'Top SHAP Driver' : 'Estimated RUL'}
                  </th>
                  <th className="py-2.5 px-4 font-medium">Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-border/40">
                {results.analysis_results.map((row, i) => (
                  <tr key={i} className="hover:bg-surface/30">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-300">{row.row_index}</td>
                    <td className="py-3 px-4 font-medium">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          row.predicted_condition === 'NORMAL' || row.predicted_condition === 'HEALTHY'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {row.predicted_condition}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {results.mode === 'ai4i' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-surface-elevated rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                (row.failure_probability || 0) > 0.5 ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.round((row.failure_probability || 0) * 100))}%` }}
                            />
                          </div>
                          <span>{((row.failure_probability || 0) * 100).toFixed(1)}%</span>
                        </div>
                      ) : (
                        <span>{((row.confidence || 0) * 100).toFixed(1)}%</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                          row.risk_level === 'CRITICAL' || row.risk_level === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-300'
                            : row.risk_level === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {row.risk_level}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-brand-300">
                      {results.mode === 'ai4i' ? (
                        <span>{row.top_shap_driver || 'N/A'}</span>
                      ) : (
                        <span>
                          {row.estimated_rul_hours !== undefined
                            ? `${row.estimated_rul_hours.toFixed(1)} hrs`
                            : 'N/A'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-xs max-w-xs">
                      {row.recommended_action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
