# MACHINA-X: Comprehensive Engineering & Research Changelog (Final Pass)

This document provides a complete audit trail of all architectural enhancements, experimental evaluations, research reconciliation, and UI/UX modernization completed across Parts 1, 1B, 2, and 3.

---

## Part 1: Research Rigor, Hyperparameter Reconciliation & Latency Benchmarks

### 1. Hyperparameter Reconciliation
- **Created:** `ml/artifacts/hyperparameters.json` documenting exact verified model hyperparameters:
  - Stage 1 Isolation Forest: `n_estimators = 150`, `contamination = 0.05`, `random_state = 42`.
  - Stage 2 XGBoost Classifier: `n_estimators = 120`, `max_depth = 5`, `learning_rate = 0.08`, `subsample = 0.85`, `colsample_bytree = 0.85`.
  - Stage 3 LSTM Sequence Regressor: Unidirectional 2-layer LSTM, `hidden_dim = 32`, `dropout = 0.1`, `learning_rate = 0.005`, `epochs = 40`, `batch_size = 32`.
- **Reconciled Documentation:** Updated `docs/model_card.md`, `docs/paper_update_guide.md`, and `docs/reports/` to align with the code implementation.

### 2. Empirical Hardware Latency Benchmarking
- **Implemented:** `scripts/benchmark_latency.py` benchmarking 550 total 1-second current and vibration windows (50 warmup + 500 timed iterations) on AMD Ryzen 5 4600H CPU, Windows 10, Python 3.10.
- **Saved:** `ml/artifacts/latency_metrics.json`.
- **Eliminated:** The unmeasured "42.6 ms" claim, replacing it with verified p50 and p95 distributions:
  - Feature extraction: 2.52 ms (p50: 2.39 ms, p95: 3.27 ms)
  - Stage 1 Isolation Forest: 9.45 ms (p50: 9.13 ms, p95: 11.35 ms)
  - Stage 2 XGBoost: 1.41 ms (p50: 1.30 ms, p95: 1.84 ms)
  - Fast TreeSHAP (Top 5): 3.82 ms (p50: 3.62 ms, p95: 5.08 ms)
  - Complete End-to-End Decision Pipeline: **17.43 ms** (p50: **16.68 ms**, p95: **21.32 ms**).

### 3. Run-Level Split Semantics & RUL Baselines
- Disclosed exact dataset splitting semantics in `ml/artifacts/fault_classifier_metrics.json` and `ml/artifacts/anomaly_detector_metrics.json`:
  - 104 train runs (624 windows), 52 val runs (312 windows), 52 held-out test runs (312 windows).
- Added Ridge Regression and Mean Baselines to `ml/artifacts/rul_metrics.json` alongside per-run test errors for the 4 held-out degradation trajectories (`RUL_BRO_03`: 0.209 h, `RUL_STA_03`: 0.188 h, `RUL_BEA_03`: 0.245 h, `RUL_AIR_03`: 0.237 h; mean test MAE: 0.220 h).

### 4. Public Benchmark Provenance Correction (AI4I 2020)
- Corrected author attribution from "Mathes, S." to **Stephan Matzka (2020)** in `ml/artifacts/ai4i/ai4i_evaluation_metrics.json` and all documentation.
- Explicitly documented that AI4I 2020 is a synthetic milling machine process dataset and completely distinct from 3-phase induction motor current and vibration telemetry.

### 5. Multi-Seed Robustness & LOLO Cross-Load Generalization
- **Implemented:** `scripts/run_robustness_eval.py` executing:
  - 5-seed evaluation (seeds 42, 101, 2024, 7, 999): $0.9487 \pm 0.0083$ accuracy, $0.9001 \pm 0.0170$ macro F1.
  - Leave-One-Load-Out (LOLO) evaluation across 25%, 50%, 75%, and 100% load conditions: mean accuracy 70.83%, macro F1 0.6121.
- **Saved:** `ml/artifacts/robustness_metrics.json`.

### 6. Honest Weakness Disclosure
- Rewrote `docs/limitations.md` frankly disclosing:
  - Healthy class recall of 41.7% due to a 12:1 training imbalance against healthy samples.
  - Isolation Forest anomaly recall of 72.57%.
  - Idealized simulation mathematical signatures and performance drop across operating loads.
  - Evaluation of RUL across 4 held-out simulated degradation trajectories.

### 7. Repository Hygiene
- Created `LICENSE` (MIT), `CITATION.cff`, `scripts/reproduce_all.ps1`.
- Cleaned absolute personal file paths from `README.md`.
- Labeled `docs/extracted_paper_text.txt` as an outdated draft.
- Updated `scripts/generate_research_report.py` and regenerated DOCX/Markdown reports.

---

## Part 1B: Advanced Baselines, Quality Checks & Publication Assets

### 1. PyTorch Reconstruction Autoencoder (Stage 1 Baseline)
- **Implemented:** `ml/training/train_autoencoder.py` (3-layer PyTorch encoder-decoder with ReLU activations).
- **Trained:** Strictly on healthy training runs; optimal anomaly threshold selected on validation split.
- **Evaluated:** Test split achieved Recall: 96.18%, Precision: 93.90%, F1: 95.03%, ROC-AUC: 0.9018.
- **Saved:** `ml/artifacts/autoencoder_metrics.json`.

### 2. 1-D Waveform CNN (Stage 2 Raw Signal Baseline)
- **Implemented:** `ml/training/train_1d_cnn.py` operating on raw $(B, 2, 10000)$ stator current and vibration waveform windows without manual feature extraction.
- **Evaluated:** Held-out test split achieved Accuracy: 92.31%, Macro F1: 77.14%.
- **Saved:** `ml/artifacts/cnn_1d_metrics.json`.

### 3. Formal Model Selection Architecture
- **Created:** `ml/artifacts/model_selection.json` specifying formal multi-criterion decision rules across validation accuracy, latency, edge deployment feasibility, and exact TreeSHAP compatibility.
- **Decision:** Isolation Forest selected for Stage 1 (zero-tuning unsupervised baseline) and XGBoost selected for Stage 2 (optimal accuracy, 1.41 ms latency, native TreeSHAP).

### 4. Comprehensive Model Quality Checks
- **Implemented:** `scripts/run_model_quality_checks.py`.
- **Saved:** `ml/artifacts/model_quality_checks.json`.
- **Evaluations:**
  - **Calibration:** Platt scaling reduced Expected Calibration Error (ECE) by 73.67% (from 0.3543 to 0.0933).
  - **Unknown Fault Rejection:** Tested against unseen combined rotor bar + bearing defect windows; flagged under decision threshold $\theta = 0.7458$.
  - **Unseen Severity:** Model trained on 0.0, 0.3, 0.9 severity achieved 98.70% accuracy on held-out 0.6 severity.
  - **Sensor Modality Ablation:** Temperature only (32.37%), Vibration only (86.86%), Current only (89.74%), Current + Vibration (90.71%), All Three Sensors (94.23%, F1: 0.8880).
  - **Bootstrap Confidence Intervals:** 1,000 resamples yielded 95% CI Accuracy $[0.9199, 0.9679]$ and Macro F1 $[0.8371, 0.9284]$.
  - **McNemar's Significance:** vs Random Forest ($p=0.1139$), vs SVM ($p=0.8445$).
  - **Measurable Explainability:** Physics consistency score of 90.97%; fidelity deletion showed 22.7x higher accuracy drop when removing top SHAP features versus random features.

### 5. Case Western Reserve University (CWRU) Real Bearing Benchmark
- **Implemented:** `scripts/eval_cwru_dataset.py` downloading and evaluating physical 12k drive-end accelerometer signals.
- **Saved:** `ml/artifacts/real_data_cwru_metrics.json`.
- **Results:**
  - Within-CWRU Benchmark: **100.0% Accuracy**, Macro F1 1.000.
  - Zero-Shot Sim-to-Real Transfer: **72.50% Accuracy**, Macro F1 0.684 (disclosing 27.5% drop due to physical structure transmission resonances and sensor damping).

### 6. Publication Figures & LaTeX Snippets
- **Implemented:** `scripts/make_paper_figures.py`.
- **Generated in `docs/paper_assets/` (both 300-DPI `.png` and vector `.pdf`):**
  - `fig1_confusion_matrix`: Stage 2 XGBoost normalized confusion matrix with raw counts.
  - `fig2_shap_importance`: Physics-guided TreeSHAP feature attribution ranking.
  - `fig3_rul_trajectories`: True vs. predicted RUL trajectories with $\pm 1$ MAE uncertainty bands across 4 held-out runs.
  - `fig4_modality_ablation`: Sensor ablation performance bar chart.
  - `fig5_cross_load_lolo`: Domain generalization across 25%, 50%, 75%, 100% loads.
  - `fig6_snr_noise_robustness`: Accuracy degradation curve as Gaussian noise SNR decreases from 30 dB to 5 dB.
  - `fig7_cwru_transfer`: Within-dataset vs. Sim-to-Real transfer performance comparison.
  - `tables.tex`: LaTeX tables for multi-stage comparison, modality ablation, and hardware latency distributions.

### 7. CI Workflow & Digital Twin Refinements
- **Created:** `.github/workflows/ci.yml` running pytest, Maven tests, and Vite production build.
- **Added:** `tests/locustfile.py` for FastAPI concurrency load testing.
- **Implemented:** Health score Exponentially Weighted Moving Average (EWMA, $\alpha = 0.3$) smoothing in `DigitalTwinService.java` to prevent transient score jitter.

---

## Part 2: Complete UI/UX Redesign — Warm Paper Instrument Panel Aesthetic

### 1. Design Token Implementation
- **Implemented in `frontend/index.html`, `frontend/src/index.css`, and `frontend/tailwind.config.js`:**
  - Light mode: `--bg: #f3efe6`, `--panel: #fbf9f4`, `--ink: #1b1a17`, `--mute: #6f6a5f`, `--rule: #d9d2c3`, `--ok: #2f6b4f`, `--warn: #b7791f`, `--bad: #c2410c`, `--pos: #c2410c`, `--neg: #2d5d7b`, `--track: #e6dfd0`.
  - Dark mode: `--bg: #151512`, `--panel: #1c1c18`, `--ink: #ece7da`, `--mute: #9a9486`, `--rule: #33322b`, `--ok: #6fbf98`, `--warn: #e0a84a`, `--bad: #f08a52`, `--pos: #f08a52`, `--neg: #7fb2d4`, `--track: #2a2923`.
  - Typography: Google Fonts `Fraunces` (headlines and verdict), `Hanken Grotesk` (UI body), `JetBrains Mono` (tabular numbers and telemetry).

### 2. Modernized Navigation Rail (`LeftRail.tsx`)
- Replaced the AI dashboard navbar with a 68px sticky icon rail:
  - MX serif monogram mark.
  - Section links with icons, hover states, and active alert counters.
  - One-click simulator toggle and dark/light theme switch.
  - Clean responsive collapse into a bottom bar on mobile (<860px).

### 3. Instrument Panel Components
- **`InstrumentHero.tsx`:** SVG health ring (9px stroke) + tabular health score + bold serif verdict ("Bearing outer race defect detected", "Normal steady-state operation") + lede explanation + 3 key facts (anomaly score, confidence, RUL).
- **`SparklineMetricsRow.tsx`:** 4 telemetry metric columns separated by hairline vertical rules with real SVG trend sparklines.
- **`DivergingShapSection.tsx`:** Zero-centered diverging attribution bars (red for positive fault risk, blue for negative healthy evidence) with physical signature explanations.
- **`ModelProvenanceTable.tsx`:** Embedded table disclosing model versions, sample counts, verified metrics, latency, and prominent `SIMULATED DATA` vs `REAL PHYSICAL DATA` badges.

---

## Part 3: Documentation & Verification Summary

### Key Verification Metrics
- **Python Unit & Pipeline Tests:** `21 passed` (Task-1507)
- **Spring Boot Backend Tests:** `7 passed, BUILD SUCCESS` (Task-1516)
- **React Vite Frontend Build:** `Built in 20.56s, 0 errors` (Task-1913)
