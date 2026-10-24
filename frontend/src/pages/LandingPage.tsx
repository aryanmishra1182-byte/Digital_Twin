import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  Waves,
  Thermometer,
  Gauge,
  CheckCircle2,
  FileText,
  ExternalLink,
  Sliders,
  TrendingDown,
  Database
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGuestEntry = () => {
    localStorage.setItem('twin_user', JSON.stringify({
      id: 'guest-01',
      name: 'Guest Researcher',
      email: 'researcher@academic.edu',
      role: 'RESEARCHER'
    }));
    navigate('/fleet');
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Navigation Header */}
      <header className="border-b border-rule sticky top-0 z-50 bg-bg/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 border border-ink flex items-center justify-center font-serif font-bold text-lg">
              MX
            </div>
            <div>
              <span className="font-serif font-semibold text-base text-ink tracking-tight">MACHINA-X</span>
              <span className="hidden sm:inline text-xs text-mute ml-2">Explainable Cyber-Physical Digital Twin</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/research')}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-mute hover:text-ink transition-colors cursor-pointer"
            >
              Research Paper
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-3.5 py-1.5 rounded-full border border-rule bg-panel hover:bg-track text-xs font-medium text-ink transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={handleGuestEntry}
              className="px-4 py-1.5 rounded-full bg-ink text-bg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explore Platform</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-panel border border-rule text-mute mb-6 font-mono">
          <span className="w-2 h-2 rounded-full bg-ok animate-pulse" />
          <span>Explainable Digital Twin Platform for Rotating Industrial Machinery</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-normal text-ink max-w-4xl leading-[1.08]">
          Closed-Loop Physical Modeling meets Explainable Machine Learning
        </h1>

        <p className="mt-5 text-base sm:text-lg text-mute max-w-2xl leading-relaxed font-sans">
          Monitor induction motors, detect incipient mechanical and electrical wear, forecast remaining useful life, and understand every prediction with game-theoretic SHAP explainability.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleGuestEntry}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-ink text-bg text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Launch Operator Workbench</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/research')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-rule bg-panel hover:bg-track text-ink text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-mute" />
            <span>View Experimental Results</span>
          </button>
        </div>

        {/* Visual Comparison: Physical Machine vs. Digital Twin */}
        <div className="mt-14 w-full bg-panel border border-panel-border rounded-xl p-6 sm:p-8 shadow-elevated text-left">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-panel-border/60">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Architecture Concept</span>
              <h2 className="text-xl font-bold text-slate-100 mt-0.5">Physical Machine & Digital Counterpart Synchrony</h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400" /> Stator Current (10 kHz)</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-400" /> Radial Vibration</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Casing Temp</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Box 1: Physical Asset */}
            <div className="bg-surface/40 border border-panel-border rounded-lg p-5">
              <div className="w-8 h-8 rounded bg-sky-950/40 border border-sky-800/40 text-sky-400 flex items-center justify-center mb-3">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">Physical Equipment</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                415V, 3-Phase Squirrel Cage Induction Motor operating under variable industrial torque load (25% to 100%).
              </p>
              <div className="mt-4 pt-3 border-t border-panel-border/40 text-[11px] font-mono text-slate-300 space-y-1">
                <div>• Rated Power: 3.0 kW</div>
                <div>• Synchronous: 1500 RPM</div>
                <div>• Slip: s ≈ 0.04 (1440 RPM)</div>
              </div>
            </div>

            {/* Box 2: Telemetry & Ingestion */}
            <div className="bg-surface/40 border border-panel-border rounded-lg p-5">
              <div className="w-8 h-8 rounded bg-violet-950/40 border border-violet-800/40 text-violet-400 flex items-center justify-center mb-3">
                <Waves className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">Real-Time Digital Shadow</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                10,000 samples/sec continuous windowing. Spectral FFT extracts MCSA sidebands and ball pass frequencies.
              </p>
              <div className="mt-4 pt-3 border-t border-panel-border/40 text-[11px] font-mono text-slate-300 space-y-1">
                <div>• MCSA: fs(1 ± 2s) sidebands</div>
                <div>• Vibration Kurtosis & BPFO</div>
                <div>• Thermal Rate of Rise (ΔT)</div>
              </div>
            </div>

            {/* Box 3: Predictive Inference */}
            <div className="bg-surface/40 border border-panel-border rounded-lg p-5">
              <div className="w-8 h-8 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 flex items-center justify-center mb-3">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">Explainable Predictive Twin</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Multi-stage AI classifies failure modes, forecasts RUL, and explains every prediction in plain language using TreeSHAP.
              </p>
              <div className="mt-4 pt-3 border-t border-panel-border/40 text-[11px] font-mono text-slate-300 space-y-1">
                <div>• Stage 1: Isolation Forest (Outliers)</div>
                <div>• Stage 2: XGBoost (Physics Multiclass)</div>
                <div>• Stage 3: PyTorch LSTM RUL</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Workflow: How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-panel-border/60">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-brand-400">Workflow</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mt-1">
            How Monitoring, Prediction & Maintenance Connect
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Eliminating surprise equipment downtime through continuous digital twin feedback.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-panel border border-panel-border rounded-lg p-6 flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs font-semibold text-brand-400">Step 01</span>
              <h3 className="text-base font-semibold text-slate-100 mt-2">Continuous Observation</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Sensor telemetry streams into the digital twin every second. The system calculates 26 physical features across current harmonics, mechanical shock vibration, and thermal rise.
              </p>
            </div>
            <div className="mt-4 text-[11px] text-slate-300 font-mono">
              → 10 kHz High-Res Sampling
            </div>
          </div>

          <div className="bg-panel border border-panel-border rounded-lg p-6 flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs font-semibold text-amber-400">Step 02</span>
              <h3 className="text-base font-semibold text-slate-100 mt-2">Predictive Detection</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Before physical damage occurs, the AI identifies subtle signatures of degradation: rotor bar cracking, turn-to-turn insulation breakdown, or bearing race flaking.
              </p>
            </div>
            <div className="mt-4 text-[11px] text-slate-300 font-mono">
              → Stage 1 Outlier + Stage 2 Classifier
            </div>
          </div>

          <div className="bg-panel border border-panel-border rounded-lg p-6 flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs font-semibold text-emerald-400">Step 03</span>
              <h3 className="text-base font-semibold text-slate-100 mt-2">Explainable Action</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Operators receive actionable maintenance guidance governed by IEEE and ISO standards, paired with SHAP attribution charts explaining why the prediction was made.
              </p>
            </div>
            <div className="mt-4 text-[11px] text-slate-300 font-mono">
              → IEEE 522 / ISO 10816-3 Guidance
            </div>
          </div>
        </div>
      </section>

      {/* Plain Language Fault Diagnosis Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-panel-border/60">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-brand-400">Physical Mechanisms</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mt-1">
            Understanding Equipment Problems in Plain Language
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Clear physical explanations so maintenance teams can act with confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-panel border border-panel-border rounded-lg p-5">
            <div className="w-2 h-2 rounded-full bg-sky-400 mb-3" />
            <h3 className="font-semibold text-slate-100 text-sm">Broken Rotor Bar</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              When a copper rotor bar fractures, current is forced into neighboring bars, creating modulation sidebands at ~46 Hz and ~54 Hz.
            </p>
            <div className="mt-3 text-[11px] font-mono text-slate-300">Action: Inspect cage end rings</div>
          </div>

          <div className="bg-panel border border-panel-border rounded-lg p-5">
            <div className="w-2 h-2 rounded-full bg-amber-400 mb-3" />
            <h3 className="font-semibold text-slate-100 text-sm">Stator Turn Short</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Enamel insulation failure between adjacent copper turns causes circulating fault currents, 150 Hz distortion, and localized hotspots.
            </p>
            <div className="mt-3 text-[11px] font-mono text-slate-300">Action: Surge test (IEEE 522)</div>
          </div>

          <div className="bg-panel border border-panel-border rounded-lg p-5">
            <div className="w-2 h-2 rounded-full bg-rose-400 mb-3" />
            <h3 className="font-semibold text-slate-100 text-sm">Bearing Race Defect</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Rolling elements rolling over flaked outer or inner raceways produce repetitive mechanical shock impacts and elevated kurtosis.
            </p>
            <div className="mt-3 text-[11px] font-mono text-slate-300">Action: Replace 6205 bearing</div>
          </div>

          <div className="bg-panel border border-panel-border rounded-lg p-5">
            <div className="w-2 h-2 rounded-full bg-purple-400 mb-3" />
            <h3 className="font-semibold text-slate-100 text-sm">Air-Gap Eccentricity</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Uneven clearance between the stationary stator bore and spinning rotor causes 1x shaft rotational vibration (24 Hz).
            </p>
            <div className="mt-3 text-[11px] font-mono text-slate-300">Action: Re-align shaft shims</div>
          </div>
        </div>
      </section>

      {/* Dataset & Benchmark Validation Callout */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-surface/30 border border-panel-border rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-brand-400">Benchmark Provenance</span>
            <h3 className="text-lg font-bold text-slate-100 mt-1">
              Evaluated on the UCI AI4I 2020 Predictive Maintenance Dataset
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              10,000 synthetic industrial milling instances evaluated across Logistic Regression, Decision Trees, Random Forest, and champion XGBoost with cross-validation and TreeSHAP attribution.
            </p>
          </div>
          <button
            onClick={() => navigate('/research')}
            className="px-4 py-2 rounded-md bg-panel border border-panel-border hover:bg-surface text-xs font-semibold text-slate-200 transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
          >
            <span>Read Research Report</span>
            <ExternalLink className="w-3.5 h-3.5 text-brand-400" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-panel-border/60 py-8 bg-canvas-subtle mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span className="font-bold text-slate-200">MACHINA-X Digital Twin</span> · IEEE Induction Motor Predictive Maintenance Framework
          </div>
          <div className="text-[11px] text-slate-400 text-center sm:text-right">
            Research Specification · Aditya Gupta, Aditya Maurya, Ananya Sharma, Aryan Mishra
          </div>
        </div>
      </footer>
    </div>
  );
};
