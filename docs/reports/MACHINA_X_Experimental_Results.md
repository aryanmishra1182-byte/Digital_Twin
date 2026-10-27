# MACHINA-X: Explainable AI-Driven Digital Twin Framework for Predictive Maintenance
## Comprehensive Empirical Research Report & Benchmark Evaluation

**Project**: MACHINA-X Digital Twin Platform  
**Research Domain**: Cyber-Physical Systems, Electrical Machine Diagnostics, Explainable Artificial Intelligence (XAI)  
**Authors**: Aditya Gupta, Aditya Maurya, Ananya Sharma, Aryan Mishra  
**Supervisor**: Ms. Monika Sharma  
**Evaluation Timestamp**: October 2026  
**Document Classification**: Academic Research Technical Report (TR-2026-MX1)  

---

## 1. Executive Summary

This technical report delivers the complete empirical results, algorithmic benchmarks, and explainability evaluations for **MACHINA-X**, an explainable digital twin framework engineered for condition monitoring, anomaly detection, multi-fault diagnostics, and remaining useful life (RUL) estimation in industrial electro-mechanical systems.

The diagnostic pipeline is evaluated across two empirical tracks and one physical benchmark:
1. **Track A (UCI AI4I 2020 Benchmark)**: 10,000 synthetic milling-machine instances with extreme 28.5:1 class imbalance.
2. **Track B (Cyber-Physical Induction Motor Twin)**: 10,000 windows across 1,000 simulation runs modeling a 3 kW, 415 V, 50 Hz 4-pole motor across 5 health states.
3. **External Real-Data Physical Validation (CWRU Bearing Dataset)**: Real vibration accelerometer measurements from the Case Western Reserve University 12k Drive End testbed under cross-load evaluation.

---

## 2. System Architecture & Model Selection

- **Evaluation Partition for Selection**: VALIDATION (dataset_val.csv, zero test leakage)
- **Pareto Tolerance Band**: $\le 0.02$ Macro F1
- **Stage 1 Champion**: `IsolationForest`
- **Stage 2 Champion**: `XGBoost`
- **Decision Logic**: Top Validation Macro F1 is 0.9592. Candidates within 0.02 tolerance band: ['XGBoost', 'RandomForest']. 'XGBoost' is algorithmically selected based on validation performance (Val Macro F1 = 0.9558, Val Accuracy = 95.60%) while offering the lowest inference latency (1.17 ms mean, 1.04 ms p50) and native exact TreeSHAP explainability.

---

## 3. Track A Benchmark: UCI AI4I 2020 Predictive Maintenance Dataset

- **Total Instances**: 10,000 (9,661 healthy, 339 failure, imbalance 28.5:1)
- **Champion Architecture**: XGBoost Classifier

| Model Architecture | Test Accuracy | Precision | Recall | F1-Score | ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Logistic Regression (Baseline) | 85.75% | 17.80% | 88.24% | 0.2963 | 0.9393 |
| Decision Tree (Baseline) | 95.00% | 38.89% | 82.35% | 0.5283 | 0.8568 |
| Random Forest | 98.40% | 74.32% | 80.88% | 0.7746 | 0.9831 |
| XGBoost Classifier | 98.45% | 74.03% | 83.82% | 0.7862 | 0.9808 |

---

## 4. Track B Benchmark: Three-Phase Induction Motor Digital Twin

### 4.1 Dataset Semantics & Partitioning Protocol
- **Total Workload**: 10,000 1.0 s windows across 1,000 runs (10 windows/run)
- **Train Partition**: 6,000 windows (600 runs, 60.0%)
- **Validation Partition**: 2,000 windows (200 runs, 20.0%)
- **Held-Out Test Partition**: 2,000 windows (200 runs, 20.0%)

### 4.2 Stage 1 Anomaly Detection Performance
- **Isolation Forest (Champion)**: FPR = 4.25%, Recall = 70.38%, F1 = 0.8210, ROC-AUC = 0.8461
- **Autoencoder Baseline**: Recall = 97.44%, F1 = 0.8919, ROC-AUC = 0.8556

### 4.3 Stage 2 Multiclass Fault Classification (2,000 Unseen Test Windows)
- **XGBoost Classifier**: Test Accuracy = **96.40%**, Macro F1 = **0.9639**

| Health / Fault Class | Precision (%) | Recall (%) | F1-Score | Test Windows Support |
| :--- | :---: | :---: | :---: | :---: |
| **HEALTHY** | 96.59% | 85.00% | 0.9043 | 400 |
| **BROKEN_ROTOR_BAR** | 100.00% | 100.00% | 1.0000 | 400 |
| **STATOR_INTER_TURN_SHORT** | 100.00% | 100.00% | 1.0000 | 400 |
| **BEARING_DEFECT** | 86.64% | 97.25% | 0.9164 | 400 |
| **AIR_GAP_ECCENTRICITY** | 100.00% | 99.75% | 0.9987 | 400 |

### 4.4 Multi-Seed Robustness & Leave-One-Load-Out Generalization
- **5-Seed Cross-Run Stability**: Accuracy = 95.30% $\pm$ 0.71%, Macro F1 = 0.9528 $\pm$ 0.0071
- **Leave-One-Load-Out (LOLO)**: Mean Accuracy across loads = 70.42%, Mean Macro F1 = 0.6572

---

## 5. Remaining Useful Life (RUL) Prognostics
- **Evaluated Sequences**: 1,152 sequences across 12 held-out degradation runs (history length $k=5$)
- **Champion LSTM Regressor**: MAE = **0.7466 hours**, RMSE = **1.1849 hours**
- **Gradient Boosting Baseline**: MAE = 0.8172 hours, RMSE = 1.2348 hours
- **Ridge Baseline**: MAE = 1.2986 hours, RMSE = 1.7571 hours

---

## 6. External Real-Data Physical Validation: Case Western Reserve University (CWRU)
- **Testbed**: Reliance Electric 2 HP Induction Motor with Deep Groove Ball Bearings (6205-2RS JEM SKF)
- **Sampling & Filtering**: Resampled from 12,000 Hz to 10,000 Hz polyphase FIR
- **Cross-Load Evaluation (Train Loads 0-1, Test Load 3)**: Accuracy = **70.00%**, Macro F1 = **0.3626** (70 test windows)
  - Normal Class Recall: 100.0%, Precision: 93.02%
  - Inner Race Recall: 90.00%, Precision: 33.33%
- **Few-Shot Fine-Tuning Transfer Progression**:
  - $k = 0$: Mean Accuracy = 57.14% ($\pm 0.00\%$), Macro F1 = 0.3636
  - $k = 5$: Mean Accuracy = 57.14% ($\pm 0.00\%$), Macro F1 = 0.1818
  - $k = 10$: Mean Accuracy = 81.57% ($\pm 4.63\%$), Macro F1 = 0.6321
  - $k = 20$: Mean Accuracy = 75.43% ($\pm 7.25\%$), Macro F1 = 0.4933
  - $k = 50$: Mean Accuracy = 79.29% ($\pm 6.07\%$), Macro F1 = 0.5792

---

## 7. Hardware Inference Latency Benchmark
Directly timed over **500 consecutive 1-second telemetry windows** on host hardware (Windows 10 (10.0.26200), AMD Ryzen 5 4600H with Radeon Graphics, Python 3.10.0):
- **Physics Feature Extraction (26 features)**: Mean = 2.75 ms | p50 = 2.66 ms | p95 = 3.47 ms
- **Stage 1 Isolation Forest**: Mean = 10.90 ms | p50 = 10.71 ms | p95 = 12.02 ms
- **Stage 2 XGBoost Classifier**: Mean = 1.17 ms | p50 = 1.04 ms | p95 = 1.70 ms
- **Stage 4 TreeSHAP Attribution**: Mean = 4.80 ms | p50 = 4.67 ms | p95 = 6.06 ms
- **Complete End-to-End Pipeline**: Mean = **32.80 ms** | p50 = **31.87 ms** | p95 = **38.00 ms**

---

## 8. Scientific Limitations & Research Boundaries
1. **Simulated RUL Trajectory Boundaries**: Stage 3 LSTM RUL predictions are evaluated across 12 held-out simulated degradation runs (1,152 test sequences, MAE = 0.7466 hrs, RMSE = 1.1849 hrs). While mathematically rigorous on the simulated multi-law degradation model, these results must not be claimed as physical motor remaining-life validation without multi-month physical endurance bench testing.
2. **CWRU Physical Generalization Bounds**: The 70.00% zero-shot cross-load accuracy on CWRU bearing vibration (tested on Load 3 after training on Loads 0-1) exhibits class imbalance: Normal recall is 100.0%, but fault mode shifts require few-shot real-window fine-tuning (reaching 81.57% at k=10) to accommodate load-dependent slip and contact angle alterations.
3. **Severe Class Imbalance in AI4I Benchmark**: The 98.45% test accuracy on UCI AI4I 2020 operates against a 96.61% healthy baseline. Model evaluation must emphasize the minority failure-class binary F1 (0.7862) and macro F1 (0.8891) rather than raw accuracy alone.
4. **Simulator vs Physical IoT Telemetry**: The live streaming motor telemetry in the demonstrator originates from an in-memory physical differential simulator; it demonstrates edge architecture and explainability readiness, not a deployed industrial field IoT sensor network.
5. **Inverter Carrier Harmonics**: The current physical model assumes pure sinusoidal line voltage; variable-frequency drive (VFD) carrier harmonics (2-16 kHz) remain an area for future hardware-in-the-loop validation.
6. **Compound Fault Coupling**: When electrical stator shorts and mechanical bearing defects occur concurrently, feature attributions reflect both fault vectors; out-of-distribution rejection routes cases with posterior entropy > 0.40 to human engineer review.

