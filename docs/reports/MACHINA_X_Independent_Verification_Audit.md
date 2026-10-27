# MACHINA-X: Independent Verification & Scientific Integrity Audit Report

> **Audit Date & Time (UTC):** 2026-10-27T17:19:00Z  
> **Committed Version (HEAD):** Commit `0a9cfef3187e38926b6082a8e1026890e6b7ef8c`  
> **Target Branch:** `main` (Synchronized with `origin/main`)  
> **Working Tree Status:** Clean (`nothing to commit, working tree clean`)  
> **Platform / Environment:** Windows 10 (10.0.26200), Python 3.10.0, Node.js v18+, JDK 21 (Eclipse Adoptium 21.0.12.8-hotspot), Apache Maven 3.9.9

---

## 1. Executive Summary & Verification Matrix

All automated test suites, build pipelines, integrity assertions, and runtime microservice workflows were independently executed on the committed version of the project.

| Verification Domain | Execution Command | Tests / Checks | Terminal Exit Code | Status |
| :--- | :--- | :---: | :---: | :---: |
| **System Integrity & Provenance** | `python scripts/verify_integrity.py` | 78 / 78 Invariants | `0` | **PASSED** |
| **Integrity Verifier Unit Tests** | `pytest tests/test_verify_integrity.py -v` | 10 / 10 Tests | `0` | **PASSED** |
| **ML Microservice & Pipelines** | `pytest tests/ -v` | 36 / 36 Tests | `0` | **PASSED** |
| **Frontend Component & Unit Tests**| `cd frontend && npm test -- --run` | 27 / 27 Tests (4 suites) | `0` | **PASSED** |
| **Frontend Production Build** | `cd frontend && npm run build` | 1,589 Modules Transformed | `0` | **PASSED** |
| **Backend Integration & Controllers**| `cd backend && mvn test` | 9 / 9 Integration Tests | `0` | **PASSED** |
| **Live Digital Twin Ingestion** | `GET http://localhost:3000/api/v1/twin` | 2 Registered Twins | HTTP `200` | **VERIFIED** |
| **Scenario Telemetry Injection** | `POST http://localhost:3000/api/v1/simulator/start` | Parameter Modulation | HTTP `200` | **VERIFIED** |
| **AI Inference & SHAP Attribution**| `GET http://localhost:3000/api/v1/predictions/history/MOTOR-001` | TreeSHAP Waterfall | HTTP `200` | **VERIFIED** |
| **Data Lab Malformed CSV Guard** | `POST http://localhost:3000/ml-api/csv/analyze/motor` | Schema Validation Error | HTTP `200` | **VERIFIED** |
| **Data Lab Valid Batch Analysis** | `POST http://localhost:3000/ml-api/csv/analyze/ai4i` | Row Inference + SHAP | HTTP `200` | **VERIFIED** |
| **Document Streaming Endpoints** | `GET http://localhost:3000/docs/reports/*.pdf` | PDF Binary Stream | HTTP `200` | **VERIFIED** |

---

## 2. Terminal Commands Executed & Real Outputs

### A. System Integrity Suite (`python scripts/verify_integrity.py`)
- **Exit Code:** `0`
- **Output:**
```text
=================================================================
      MACHINA-X RIGOROUS INTEGRITY & PROVENANCE SUITE            
=================================================================
[PASS] Artifact parsed valid JSON: dataset_metadata.json
[PASS] Artifact parsed valid JSON: anomaly_detector_metrics.json
[PASS] Artifact parsed valid JSON: fault_classifier_metrics.json
[PASS] Artifact parsed valid JSON: rul_metrics.json
[PASS] Artifact parsed valid JSON: latency_metrics.json
[PASS] Artifact parsed valid JSON: real_data_cwru_metrics.json
[PASS] Artifact parsed valid JSON: model_selection.json
[PASS] Artifact parsed valid JSON: stage1_diagnosis.json
[PASS] Artifact parsed valid JSON: ai4i_evaluation_metrics.json
[PASS] Artifact parsed valid JSON: model_quality_checks.json
[PASS] Artifact parsed valid JSON: robustness_metrics.json
[PASS] Text artifact loaded: paper_numbers.md
[PASS] Stage 1 Recall is finite float in [0, 1]
[PASS] Stage 1 False Positive Rate <= 5.0% (actual: 4.25%)
[PASS] Stage 1 Diagnostic FPR <= 5.0% (actual: 4.25%)
[PASS] Stage 2 Accuracy is finite float in [0, 1]
[PASS] Stage 2 Macro F1 is finite float in [0, 1]
[PASS] Stage 3 RUL MAE is positive finite number
[PASS] Stage 3 RUL RMSE is positive finite number
[PASS] Documentation matches Stage 2 Accuracy: 96.40%
[PASS] Documentation matches Stage 2 Macro F1: 0.9639
[PASS] Documentation matches Stage 1 Recall: 70.38%
[PASS] Documentation matches Stage 1 F1: 0.8210
[PASS] Documentation matches Stage 3 RUL MAE: 0.7466 hrs
[PASS] Documentation matches Stage 3 RUL RMSE: 1.1849 hrs
[PASS] Latency benchmark windows evaluated > 0 (actual: 500)
[PASS] Documentation correctly records '500 timed' windows
[PASS] Documentation does NOT report Platform as N/A
[PASS] Full pipeline latency reflects end-to-end workload >= 25ms (actual: 32.80 ms)
[PASS] Documentation contains canonical full-pipeline latency: 32.80 ms
[PASS] Stage 2 XGBoost latency reflects model-only speed (actual: 1.17 ms)
[PASS] Full production pipeline is NOT confused with unverified 3.25 ms metric
[PASS] AI4I benchmark contains champion XGBoost Classifier
[PASS] AI4I XGBoost test accuracy matches canonical 98.45% (actual: 98.45%)
[PASS] AI4I XGBoost failure-class binary F1 matches canonical 0.7862 (actual: 0.7862)
[PASS] AI4I XGBoost macro F1 matches canonical 0.8891 (actual: 0.8891)
[PASS] Documentation records AI4I test accuracy: 98.45%
[PASS] Documentation records AI4I binary F1: 0.7862
[PASS] Documentation does NOT contain unverified 99.85% AI4I claim
[PASS] Documentation does NOT contain unverified 0.8804 AI4I claim
[PASS] CWRU cross-load accuracy matches canonical 70.00% (actual: 70.00%)
[PASS] CWRU cross-load macro F1 matches canonical 0.3626 (actual: 0.3626)
[PASS] Documentation records CWRU accuracy: 70.00%
[PASS] Documentation records CWRU macro F1: 0.3626
[PASS] Dataset total samples == 10,000
[PASS] Dataset train samples == 6,000
[PASS] Dataset val samples == 2,000
[PASS] Dataset test samples == 2,000
[PASS] Documentation reports 6,000 train windows
[PASS] Documentation reports 2,000 test windows
[PASS] Model selection evaluates strictly on VALIDATION partition
[PASS] Model selection explicitly forbids test set access
[PASS] Model selection artifact records explicit metric_provenance
[PASS] Candidate XGBoost uses validation_macro_f1
[PASS] Candidate XGBoost has zero test_macro_f1 leakage
[PASS] Candidate RandomForest uses validation_macro_f1
[PASS] Candidate RandomForest has zero test_macro_f1 leakage
[PASS] Candidate SVM_RBF uses validation_macro_f1
[PASS] Candidate SVM_RBF has zero test_macro_f1 leakage
[PASS] Candidate 1D_CNN_Raw_Waveforms uses validation_macro_f1
[PASS] Candidate 1D_CNN_Raw_Waveforms has zero test_macro_f1 leakage
[PASS] All 16 Aerospace Mission Control frontend modules exist
[PASS] Frontend src/ contains zero hardcoded metrics or random generators (violations: [])
[PASS] DOCX report exists and valid (38,016 bytes)
[PASS] PDF report exists and valid (161,659 bytes)
[PASS] Markdown report exists and valid (8,064 bytes)
[PASS] Presentation Study Guide PDF exists and valid (252,541 bytes)
[PASS] Experimental report matches Stage 2 Accuracy
[PASS] Experimental report matches Stage 1 Recall
[PASS] Experimental report matches Stage 3 RUL MAE
[PASS] Experimental report matches Full Pipeline Latency
[PASS] Experimental report does NOT contain unverified 99.85% AI4I claim
[PASS] Model checkpoint exists: ml/artifacts/anomaly_detector.joblib
[PASS] Model checkpoint exists: ml/artifacts/fault_classifier.joblib
[PASS] Model checkpoint exists: ml/artifacts/rul_lstm_model.pt
[PASS] Model checkpoint exists: ml/artifacts/rul_model_bundle.joblib
[PASS] Model checkpoint exists: ml/artifacts/rf_model.joblib
[PASS] Model checkpoint exists: ml/artifacts/svm_model.joblib
[SUCCESS] All 78 dynamic consistency and integrity invariants passed successfully!
```

---

### B. Python Regression & ML Test Suite (`pytest tests/ -v`)
- **Exit Code:** `0`
- **Duration:** 36.66s
- **Test Count:** 36 passed
- **Summary:**
  - `tests/test_csv_and_ai4i.py`: 5 passed
  - `tests/test_dataset_validation.py`: 2 passed
  - `tests/test_ml_pipeline.py`: 3 passed
  - `tests/test_ml_service.py`: 6 passed
  - `tests/test_model_selection_leakage.py`: 3 passed (validation-only gating, immune to test set absence, clean failure on missing artifacts)
  - `tests/test_paper_numbers_sync.py`: 1 passed
  - `tests/test_simulator_and_features.py`: 6 passed
  - `tests/test_verify_integrity.py`: 10 passed (negative & positive fixture tests)

---

### C. Frontend Unit Tests (`npm test -- --run`)
- **Exit Code:** `0`
- **Duration:** 10.02s
- **Test Count:** 27 passed across 4 suites
- **Summary:**
  - `src/lib/plain.test.ts` (11 tests passed): nulls, missing metadata, unknown class fallbacks, immutability of dictionary constants.
  - `test/plain.test.ts` (13 tests passed): operator wording localization.
  - `test/monitor.test.tsx` (2 tests passed): backend unreachable handling and empty twin reporting state.
  - `test/no-hardcoded-numbers.test.ts` (1 test passed): verified absence of `'94.55'`, `'98.45'`, `'0.22 hrs'`, `'Math.random'`, `'99.85'`, and `'0.8804'` in `frontend/src/`.

---

### D. Frontend Production Build (`npm run build`)
- **Exit Code:** `0`
- **Duration:** 13.71s
- **Output:**
```text
vite v5.4.21 building for production...
transforming...
✓ 1589 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.89 kB │ gzip:  0.49 kB
dist/assets/index-C2eoAJEy.css   29.76 kB │ gzip:  6.04 kB
dist/assets/index-B_Vd0J6R.js   314.60 kB │ gzip: 85.22 kB
✓ built in 13.71s
```

---

### E. Backend Maven Integration Tests (`mvn test`)
- **Exit Code:** `0`
- **Duration:** 44.63s
- **Test Count:** 9 passed, 0 failures, 0 errors
- **Summary:**
  - `com.digitaltwin.motor.DigitalTwinIntegrationTest`: 7 passed
  - `com.digitaltwin.motor.HealthControllerTest`: 2 passed
  - `BUILD SUCCESS`

---

## 3. Discrepancy Reconciliation & Provenance Evidence

### A. Latency Metrics Scope Reconciliation
- **Authoritative Artifact:** `ml/artifacts/latency_metrics.json`
- **Benchmark Code:** `scripts/benchmark_latency.py` (500 timed 1.0s windows, 10,000 samples at 10 kHz).
- **Findings:**
  - **Complete End-to-End Decision Pipeline:** Mean = **$32.80\text{ ms}$**, $p_{50} = 31.87\text{ ms}$, $p_{95} = 38.00\text{ ms}$, $p_{99} = 46.82\text{ ms}$. This measures all 5 sequential steps: raw signal processing $\to$ 26-feature engineering $\to$ Isolation Forest $\to$ 5-class XGBoost $\to$ LSTM RUL regression $\to$ TreeSHAP top-5 attributions.
  - **Stage 2 Fault Classifier Alone (XGBoost):** Mean = **$1.17\text{ ms}$**, $p_{50} = 1.04\text{ ms}$, $p_{95} = 1.70\text{ ms}$, $p_{99} = 2.10\text{ ms}$.
  - **Physics Feature Extraction:** Mean = $2.75\text{ ms}$, $p_{50} = 2.66\text{ ms}$, $p_{95} = 3.47\text{ ms}$.
  - **Fast TreeSHAP Attribution:** Mean = $4.80\text{ ms}$, $p_{50} = 4.67\text{ ms}$, $p_{95} = 6.06\text{ ms}$.
  - **Resolution of $3.25\text{ ms}$ Claim:** The lower figure was an unverified claim from a conversational summary. It has been strictly excised from headline claims and all documentation.

### B. UCI AI4I 2020 Predictive Maintenance Reconciliation
- **Authoritative Artifact:** `ml/artifacts/ai4i/ai4i_evaluation_metrics.json`
- **Training Code:** `ml/training/train_ai4i_models.py` (Stratified 80/20 split; $8,000$ train, $2,000$ test).
- **Findings:**
  - **Test Accuracy:** **$98.45\%$** (1,969 / 2,000 correct instances).
  - **Binary $F_1$ (Failure Class):** **$0.7862$** (Precision: $74.03\%$, Recall: $83.82\%$, 57 TP, 11 FN, 20 FP).
  - **Macro $F_1$ (Both Classes):** **$0.8891$** (Healthy Class $F_1 = 0.9920$, Failure Class $F_1 = 0.7862$).
  - **Weighted $F_1$:** $0.9850$.
  - **ROC-AUC:** $0.9808$.
  - **Resolution of $99.85\%$ / $0.8804$ Claims:** These values could not be reproduced from any empirical training run and were discarded. All consumers now report the genuine $98.45\%$ accuracy and distinguish binary $F_1$ ($0.7862$) from macro $F_1$ ($0.8891$).

---

## 4. Unresolved Defects & Status

**Zero unresolved defects.**
- All 19 modified/added files are committed on `main` and pushed to `origin/main`.
- All background daemon processes are running healthy without proxy errors.
- Both PDF deliverables (`MACHINA_X_Experimental_Results.pdf` and `MACHINA_X_Presentation_Study_Guide.pdf`) match the underlying JSON artifacts.

---

## 5. Steps for Manual Verification

To independently verify these results on your local machine:

1. **Verify Git Sync:**
   ```powershell
   git status
   git log -n 1 --oneline
   ```
2. **Execute System Integrity Suite:**
   ```powershell
   python scripts/verify_integrity.py
   ```
3. **Execute Python ML Tests:**
   ```powershell
   pytest tests/ -v
   ```
4. **Execute Frontend Tests & Build:**
   ```powershell
   cd frontend
   npm test -- --run
   npm run build
   ```
5. **Execute Backend Maven Tests:**
   ```powershell
   cd backend
   mvn test
   ```
6. **Launch UI & Inspect Workstation:**
   Open `http://localhost:3000` in your browser:
   - Check Mission Control telemetry stream on `/overview`.
   - Inject fault scenario (e.g. Broken Rotor Bar) via simulator drawer.
   - Inspect TreeSHAP waterfall attributions on `/diagnostics`.
   - Download the verified PDFs directly from the UI header or `/research`.

---

## 6. Research Limitations & Boundaries Disclosure

1. **Simulated Motor Telemetry:** Stator current ($i_a, i_b, i_c$), shaft vibration ($v_x, v_y$), and thermal rise in the demonstrator originate from differential mathematical modeling (Park's vector transformation and magnetic air-gap permeance equations).
2. **Simulated RUL Degradation:** The LSTM RUL model achieved $0.7466\text{ h}$ MAE evaluated across 12 held-out simulated degradation runs (1,152 sequences). It is not physical motor remaining-life validation without multi-week physical accelerated endurance testing.
3. **CWRU Physical Zero-Shot Transfer:** The $70.00\%$ cross-load accuracy on CWRU bearing vibration under unseen Load 3 demonstrates that domain shift occurs across loads. Few-shot fine-tuning ($k=10$ real windows) restores accuracy to $81.57\%$, showing that target-domain calibration is required for real-world deployments.
4. **Class Imbalance Context:** The $98.45\%$ accuracy on UCI AI4I 2020 operates against a $96.61\%$ healthy baseline; the minority failure recall ($83.82\%$) and binary $F_1$ ($0.7862$) are the meaningful indicators of fault detection capability.
