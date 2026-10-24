# MACHINA-X Frontend Simplification Directive: 3-Screen Industrial Operator UI

## 1. Primary Objective & Design Philosophy
Transform the MACHINA-X user interface into an industrial-grade, human-designed operator platform inspired by modern industrial digital twins (such as Siemens MindSphere and industrial SCADA/edge dashboards).

The interface is intentionally restricted to three cohesive screens:
1. **Monitor (`/`)**: Live asset health, physical operating conditions (power, voltage, current, vibration, temperature), dual-stage ML diagnosis with confidence and explainability, and interactive digital twin controls (normal, load step, broken rotor bar, bearing defect, stator short, eccentricity).
2. **Check a File (`/check`)**: Offline diagnostic analysis tool allowing plant operators to upload CSV/JSON vibration and current logs for immediate physics feature extraction, anomaly scoring, fault classification, and SHAP attribution.
3. **About (`/about`)**: Comprehensive architecture documentation, sensor specifications, IEEE research methodology, pipeline latency benchmarks, and verified empirical metrics.

## 2. Hard Architectural Rules
- **Line Budget**: The entire frontend codebase (`src/pages/*`, `src/components/*`, `src/App.tsx`, `src/lib/*`) must remain strictly under 1,500 total lines of code to maintain extreme clarity and maintainability.
- **Zero Hardcoded Numbers**: Every metric, sensor value, health score, probability, and threshold must flow dynamically from backend APIs (`/api/v1/twin/telemetry`, `/api/v1/twin/metrics`, `/api/v1/diagnose/file`) or verified metadata.
- **Human-Centered Visual Identity**: High-contrast slate and industrial zinc palette, monospace telemetry readouts, status pills with semantic color coding (emerald = healthy, amber = degraded, rose = critical), accessible typography, and zero generic AI dashboard clutter.
- **Explainability First**: Every fault detection must be accompanied by plain-English explanations (`src/lib/plain.ts`) that translate feature attributions (e.g., sideband ratios, kurtosis, thermal rise) into actionable maintenance recommendations.

## 3. Screen Specifications

### Screen 1: Real-Time Fleet Monitor (`/`)
- Real-time connection to Spring Boot backend (`http://localhost:8080/api/v1/twin/telemetry`) with 1-second auto-refresh.
- Motor operational status: Healthy, Incipient Degradation, or Fault Alert with alarm acknowledgement.
- Primary telemetry metrics: 3-phase current RMS, vibration RMS and crest factor, stator temperature, mechanical speed (RPM), and active load percentage.
- Stage 1 Anomaly Detector (Isolation Forest) anomaly score bar with dynamic decision threshold.
- Stage 2 Fault Classifier (XGBoost) predicted health state, posterior probability, and top-3 SHAP feature attributions.
- Digital Twin Scenario Simulator: One-click buttons to inject controlled fault dynamics into the simulation twin.

### Screen 2: Offline File Diagnostic (`/check`)
- Drag-and-drop file upload accepting multi-row telemetry CSV or single-window JSON files.
- Automated client-side preview and backend submission to `/api/v1/diagnose/file`.
- Interactive results panel showing:
  - Detected fault classification and confidence score.
  - Anomaly status.
  - Remaining Useful Life (RUL) prediction with operational hours estimate.
  - Root cause attribution chart highlighting key physical indicators.
  - Recommended maintenance actions.

### Screen 3: System Architecture & Research Provenance (`/about`)
- Overview of the 4-stage explainable digital twin pipeline:
  1. High-frequency physical feature extraction (26 features across spectral, statistical, and thermal domains).
  2. Stage 1 unsupervised anomaly detection (Isolation Forest / Autoencoder).
  3. Stage 2 supervised multiclass fault classification (XGBoost champion).
  4. Stage 3 Remaining Useful Life regression (LSTM degradation model).
  5. Stage 4 TreeSHAP local explainability.
- Physical motor specifications (3 kW, 415 V, 50 Hz, 4-pole squirrel-cage induction motor).
- Link to IEEE research documentation, downloadable reports, and verification scripts.
