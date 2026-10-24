# MACHINA-X: Explainable AI-Driven Digital Twin Framework for Predictive Maintenance of Industrial Equipment
## Comprehensive Empirical Research Report & Benchmark Evaluation

**Project**: MACHINA-X Digital Twin Platform  
**Research Domain**: Cyber-Physical Systems, Electrical Machine Diagnostics, Explainable Artificial Intelligence (XAI)  
**Authors**: Aditya Gupta, Aditya Maurya, Ananya Sharma, Aryan Mishra  
**Supervisor**: Ms. Monika Sharma  
**Date of Evaluation**: October 2026  
**Document Classification**: Academic Research Technical Report (TR-2026-MX1)  

---

## 1. Executive Summary

This technical report delivers the complete empirical results, algorithmic benchmarks, and explainability evaluations for **MACHINA-X**, an explainable digital twin framework engineered for condition monitoring, anomaly detection, multi-fault diagnostics, and remaining useful life (RUL) estimation in industrial electro-mechanical systems.

Modern industrial operations rely heavily on three-phase induction motors, which consume approximately 70% of all industrial electrical energy. Unexpected downtime leads to severe productivity losses and catastrophic secondary damages. To bridge the gap between black-box deep learning models and critical operational trust, MACHINA-X integrates:
1. **Signal Preprocessing & Physics-Guided Feature Extraction**: Motor Current Signature Analysis (MCSA), vibration harmonic decomposition, and thermal dynamic tracking (26 domain features).
2. **Dual-Track Machine Learning Architecture**:
   - **Track A (Algorithmic Benchmark)**: Rigorous evaluation on the **UCI AI4I 2020 Predictive Maintenance Dataset** (synthetic milling-machine benchmark, 10,000 instances, extreme 28.5:1 class imbalance).
   - **Track B (Cyber-Physical Induction Motor Twin)**: Physics-guided multi-class fault classification and sequence-based LSTM Remaining Useful Life regressor based on IEEE motor specifications (3 kW, 415 V, 50 Hz, 4-pole).
3. **Local and Global Explainability via TreeSHAP**: Providing exact additive feature attribution for every maintenance risk prediction.
4. **Offline Batch Diagnostic Engine**: Dual-mode CSV ingestion enabling batch telemetry validation and automated root-cause reporting.

All results reported herein are derived from reproducible executions with fixed random seeds (`random_state=42`), verified multi-seed robustness assessments, and measured hardware latencies.

---

## 2. System Architecture & Verified Hyperparameters

The MACHINA-X platform comprises a five-layer cyber-physical framework with exact hyperparameters verified from code checkpoints:

1. **Ingestion Layer**: Ingests high-frequency stator current ($f_s = 10\text{ kHz}$), tri-axial vibration, and thermal time-series data or tabular telemetry records via REST and WebSocket interfaces.
2. **Feature Extraction Engine**: Computes 26 physics-guided features across time, frequency, and spectral domains, including sideband modulation frequencies $f_{brb} = f_1 (1 \pm 2s)$, bearing ball pass frequencies (BPFO, BPFI), crest factor, and kurtosis.
3. **Stage 1 (Anomaly Detection)**:
   - **Model**: Isolation Forest
   - **Trees (`n_estimators`)**: 150
   - **Contamination Parameter**: 0.05
4. **Stage 2 (Fault Classification)**:
   - **Model**: Gradient Boosted Decision Trees (XGBoost)
   - **Estimators (`n_estimators`)**: 120
   - **Learning Rate (`learning_rate`)**: 0.08
   - **Maximum Depth (`max_depth`)**: 5
   - **Subsample Ratio (`subsample`)**: 0.85
   - **Objective**: Multi-class soft probabilities (`multi:softprob`) across 5 operational states
5. **Stage 3 (Prognostics Tier)**:
   - **Model**: PyTorch Unidirectional 2-layer LSTM Sequence Regressor
   - **Input Dimension**: 26
   - **Hidden Dimension**: 32
   - **Dropout**: 0.1
   - **Learning Rate**: 0.005 (Adam optimizer)
   - **Sequence Length ($k$)**: 5 consecutive operational windows
   - **Training Parameters**: 40 epochs, batch size 32
6. **Interpretability & Digital Twin Synchronization**: TreeSHAP computes exact Shapley values $\phi_i$, mapping feature contributions to physical components visualized on an interactive digital twin schematic.

---

## 3. Track A Benchmark: UCI AI4I 2020 Predictive Maintenance Dataset

### 3.1 Dataset Overview & Provenance
- **Dataset Title**: UCI AI4I 2020 Predictive Maintenance Dataset
- **Attribution & Author**: Stephan Matzka (2020), *Explainable Artificial Intelligence for Predictive Maintenance Applications*, Third International Conference on Artificial Intelligence for Industries (AI4I 2020). UCI Machine Learning Repository (DOI: 10.24432/C5HS5C).
- **License**: Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Nature of Data**: **Synthetic benchmark modeling a milling machine tool wear process.** (Note: Does not represent physical induction motor current or vibration).
- **Total Records**: 10,000 instances
- **Failure Distribution**: 339 failures (3.39%) vs. 9,661 healthy states (96.61%)
- **Class Imbalance**: 28.5:1
- **Features Used (9)**: Air Temperature [K], Process Temperature [K], Rotational Speed [rpm], Torque [Nm], Tool Wear [min], Product Type (L/M/H), Temperature Difference [K], Mechanical Power [W], Overstrain Metric [min·Nm].
- **Validation Protocol**: 80% Train (8,000 samples) / 20% Held-Out Test (2,000 samples) stratified split; 5-fold cross-validation on the training set.

### 3.2 Comparative Algorithmic Benchmark

Table 1 summarizes the performance of four classification architectures evaluated on the held-out test split (2,000 samples, containing 68 true failures):

| Model Architecture | Accuracy | Precision | Recall | F1-Score | ROC-AUC | 5-Fold CV F1 (Mean ± Std) | 5-Fold CV ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression (Baseline)** | 85.75% | 17.80% | 88.24% | 0.2963 | 0.9393 | 0.2719 ± 0.0126 | 0.9235 |
| **Decision Tree (Baseline)** | 95.00% | 38.89% | 82.35% | 0.5283 | 0.8568 | 0.5530 ± 0.0153 | 0.9168 |
| **Random Forest** | 98.40% | 74.32% | 80.88% | 0.7746 | **0.9831** | **0.8246 ± 0.0374** | 0.9797 |
| **XGBoost Classifier (Champion)** | **98.45%** | **74.03%** | **83.82%** | **0.7862** | 0.9808 | 0.7775 ± 0.0245 | **0.9795** |

### 3.3 Confusion Matrix (Held-out Test Split, N=2,000)

For the Champion XGBoost model:
- **True Negatives (TN)**: 1,912
- **False Positives (FP)**: 20
- **False Negatives (FN)**: 11
- **True Positives (TP)**: 57
- **Specificity**: 98.96%
- **Sensitivity / Recall**: 83.82%

### 3.4 Global SHAP Feature Importance Rankings

TreeSHAP global attribution ($	ext{mean}(|\phi_i|)$ across test samples):
1. **Rotational Speed [rpm]**: $\text{mean}(|\phi|) = 1.3314$
2. **Tool Wear [min]**: $\text{mean}(|\phi|) = 1.2755$
3. **Mechanical Power [W]**: $\text{mean}(|\phi|) = 1.2263$
4. **Overstrain Metric**: $\text{mean}(|\phi|) = 0.5984$
5. **Temperature Difference [K]**: $\text{mean}(|\phi|) = 0.5015$
6. **Torque [Nm]**: $\text{mean}(|\phi|) = 0.4996$
7. **Process Temperature [K]**: $\text{mean}(|\phi|) = 0.2971$
8. **Air Temperature [K]**: $\text{mean}(|\phi|) = 0.2453$
9. **Product Type Code**: $\text{mean}(|\phi|) = 0.0646$

---

## 4. Track B Benchmark: Three-Phase Induction Motor Digital Twin

### 4.1 Simulation Environment & Strict Run Partitioning
- **Rated Specifications**: 3 kW, 415 V line-to-line, 50 Hz supply, 4-pole, squirrel-cage induction motor.
- **Operating Loads**: 25%, 50%, 75%, and 100% full rated load.
- **Strict Leakage Prevention**: Data partitioned strictly at the **simulation run level**:
  - **Train Split**: 624 windows across 104 runs (6 windows/run)
  - **Validation Split**: 312 windows across 52 runs (6 windows/run)
  - **Held-Out Test Split**: **312 windows across 52 held-out runs** (6 windows/run)

### 4.2 Multi-Class Fault Classification Results (312 Windows from 52 Held-Out Runs)

| Operational State / Fault Mode | Precision | Recall | F1-Score | Test Windows Support |
| :--- | :---: | :---: | :---: | :---: |
| **HEALTHY** | 76.92% | 41.67% | 54.05% | 24 (4 runs) |
| **BROKEN_ROTOR_BAR** | **100.00%** | **100.00%** | **1.0000** | 72 (12 runs) |
| **STATOR_INTER_TURN_SHORT**| **100.00%** | **100.00%** | **1.0000** | 72 (12 runs) |
| **BEARING_DEFECT** | 83.13% | 95.83% | 89.03% | 72 (12 runs) |
| **AIR_GAP_ECCENTRICITY** | **100.00%** | **100.00%** | **1.0000** | 72 (12 runs) |
| **Overall Macro Average** | **92.01%** | **87.50%** | **0.8862** | **312 windows (52 runs)** |
| **Overall Accuracy** | — | — | **94.55%** | **312 windows (52 runs)** |

#### Baseline Comparison:
- **XGBoost (Champion)**: Accuracy = **94.55%**, Macro F1 = **0.8862**
- **Random Forest**: Accuracy = 92.63%, Macro F1 = 0.8018
- **Support Vector Machine (RBF)**: Accuracy = 87.82%, Macro F1 = 0.7366

### 4.3 Multi-Seed Robustness & Leave-One-Load-Out Generalization

To verify statistical stability and cross-load transfer, two robustness experiments were conducted:

#### A. Multi-Seed Stability (5 Independent Seeds: [42, 101, 2024, 7, 999])
- **Stage 2 Classifier Accuracy**: **94.87% ± 0.83%**
- **Stage 2 Macro F1-Score**: **0.9001 ± 0.0170**
- **Stage 1 Anomaly F1-Score**: **0.1139 ± 0.0063**

#### B. Leave-One-Load-Out (LOLO) Generalization
Models trained on three load regimes and tested on the held-out load level:

| Held-Out Load Level | Training Load Levels | Generalization Accuracy | Generalization Macro F1 |
| :---: | :---: | :---: | :---: |
| **25% Rated Load** | 50%, 75%, 100% | 67.31% | 0.6104 |
| **50% Rated Load** | 25%, 75%, 100% | 67.31% | 0.5327 |
| **75% Rated Load** | 25%, 50%, 100% | 75.64% | 0.7220 |
| **100% Rated Load** | 25%, 50%, 75% | 73.08% | 0.5835 |
| **Mean Across Loads** | — | **70.83%** | **0.6121** |

---

## 5. Remaining Useful Life (RUL) Prognostics & Per-Run Breakdown

The unidirectional 2-layer LSTM network was evaluated across **4 held-out degradation runs** yielding 384 test sequences:
- **Champion LSTM**: MAE = **0.2199 hours (~13.2 minutes)**, RMSE = **0.2927 hours (~17.5 minutes)**
- **Ridge Regression Baseline**: MAE = 0.3310 hours, RMSE = 0.4627 hours (LSTM achieves a **33.5% error reduction**)
- **Naive Mean Baseline**: MAE = 12.0208 hours, RMSE = 13.8917 hours

### Detailed Per-Run RUL Error (4 Held-Out Trajectories):
| Held-Out Run ID | Fault Mechanism Trajectory | Test Sequences | MAE (Hours) | RMSE (Hours) |
| :--- | :--- | :---: | :---: | :---: |
| `RUL_BRO_03` | Broken Rotor Bar Degradation | 96 | 0.2093 hrs | 0.2632 hrs |
| `RUL_STA_03` | Stator Inter-Turn Short Degradation | 96 | 0.1885 hrs | 0.2421 hrs |
| `RUL_BEA_03` | Bearing Defect Fatigue Propagation | 96 | 0.2453 hrs | 0.3307 hrs |
| `RUL_AIR_03` | Air-Gap Eccentricity Asymmetry | 96 | 0.2367 hrs | 0.3247 hrs |

---

## 6. Hardware Inference Latency Benchmark

Inference latencies were directly timed over **500 consecutive 1-second operational windows** (following a 50-window warm-up) on host hardware:
- **Processor**: AMD Ryzen 5 4600H with Radeon Graphics
- **Operating System**: Windows 10 (10.0.26200)
- **Python Environment**: Python 3.10.0 (AMD64)

| Pipeline Stage | Mean Latency | Median (p50) | 95th Percentile (p95) | 99th Percentile (p99) |
| :--- | :---: | :---: | :---: | :---: |
| **Feature Extraction (26 features)** | 2.52 ms | 2.39 ms | 3.27 ms | 3.88 ms |
| **Stage 1: Isolation Forest Filter** | 9.45 ms | 9.13 ms | 11.35 ms | 12.31 ms |
| **Stage 2: XGBoost Classifier** | 1.41 ms | 1.30 ms | 1.84 ms | 2.21 ms |
| **Stage 4: TreeSHAP Attribution** | 3.82 ms | 3.62 ms | 5.08 ms | 6.40 ms |
| **Full End-to-End Ingestion Path** | **17.43 ms** | **16.68 ms** | **21.32 ms** | **26.10 ms** |

Because full pipeline latency (mean 17.43 ms, p95 21.32 ms) is substantially below the 1,000 ms acquisition window, MACHINA-X comfortably executes real-time streaming inference without telemetry backpressure.

---

## 7. Known Model Weaknesses & Limitations

To uphold strict scientific integrity, all limitations and empirical weak points are explicitly disclosed:
1. **Healthy Class Recall (41.67%)**: On the 312 test windows, the Stage 2 classifier achieved only 41.67% recall on HEALTHY operation (10/24 healthy windows correct; 14 misclassified as mild bearing defect). This stems from the 12:1 imbalance against healthy runs in the training dataset (48 healthy vs 576 faulty windows), biasing boundary decisions toward mild defect predictions.
2. **Stage 1 Anomaly Recall (72.57%)**: The unsupervised Isolation Forest missed 79 faulty windows (recall 72.57%) due to the nominal 0.05 contamination setting, which treats subtle incipient fault shifts at low load as inliers.
3. **Idealized Simulation Signatures**: Perfect 100% discrimination on broken rotor bar, stator short, and eccentricity reflects idealized mathematical signatures in the simulation generator. Physical motors with inverter PWM carrier harmonics and supply imbalance will exhibit spectral masking.
4. **Generalization Drop on Load Mismatch**: As established in Section 4.3, Leave-One-Load-Out accuracy drops to 70.83% due to load-dependent slip shifts $f_{br} = f_1(1 \pm 2s)$.
5. **Physical Experimental Testbed Validation**: While algorithmic correctness, feature extraction, and explainability are verified, physical dynamometer bench validation remains an essential requirement before safety-critical plant commissioning.

---
*Report dynamically generated from verified model artifacts by MACHINA-X Research Utilities.*
