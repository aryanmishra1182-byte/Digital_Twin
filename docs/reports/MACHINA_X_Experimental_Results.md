# MACHINA-X: Explainable AI-Driven Digital Twin Framework for Predictive Maintenance of Industrial Equipment
## Comprehensive Empirical Research Report & Benchmark Evaluation

**Project**: MACHINA-X Digital Twin Platform  
**Research Domain**: Cyber-Physical Systems, Electrical Machine Diagnostics, Explainable Artificial Intelligence (XAI)  
**Authors**: MACHINA-X Research Initiative  
**Date of Evaluation**: October 2026  
**Document Classification**: Academic Research Technical Report (TR-2026-MX1)  

---

## 1. Executive Summary

This technical report delivers the complete empirical results, algorithmic benchmarks, and explainability evaluations for **MACHINA-X**, an explainable digital twin framework engineered for condition monitoring, anomaly detection, multi-fault diagnostics, and remaining useful life (RUL) estimation in industrial electro-mechanical systems.

Modern industrial operations rely heavily on three-phase induction motors, which consume approximately 70% of all industrial electrical energy. Unexpected downtime leads to severe productivity losses and catastrophic secondary damages. To bridge the gap between black-box deep learning models and critical operational trust, MACHINA-X integrates:
1. **Signal Preprocessing & Physics-Guided Feature Extraction**: Motor Current Signature Analysis (MCSA), vibration harmonic decomposition, and thermal dynamic tracking.
2. **Dual-Track Machine Learning Architecture**:
   - **Track A (Empirical Benchmark)**: Rigorous evaluation on the **UCI AI4I 2020 Predictive Maintenance Dataset** (10,000 physical instances, extreme 28.5:1 class imbalance).
   - **Track B (Cyber-Physical Induction Motor Twin)**: Physics-guided multi-class fault classification and sequence-based LSTM Remaining Useful Life regressor based on IEEE motor specifications (3 kW, 415 V, 50 Hz, 4-pole).
3. **Local and Global Explainability via TreeSHAP**: Providing exact additive feature attribution for every maintenance risk prediction.
4. **Offline Batch Diagnostic Engine**: Dual-mode CSV ingestion enabling batch telemetry validation and automated root-cause reporting.

All results reported herein are derived from reproducible executions with fixed random seeds (`random_state=42`).

---

## 2. System Architecture & Methodology

The MACHINA-X platform comprises a five-layer cyber-physical framework:

1. **Ingestion Layer**: Ingests high-frequency stator current ($f_s = 10\text{ kHz}$), tri-axial vibration, and thermal time-series data or tabular telemetry records via REST and WebSocket interfaces.
2. **Feature Extraction Engine**: Computes 26 physics-guided features across time, frequency, and spectral domains, including sideband modulation frequencies $f_{brb} = f_1 (1 \pm 2s)$, bearing ball pass frequencies (BPFO, BPFI), crest factor, and kurtosis.
3. **Anomaly & Diagnostic Tier**:
   - **Unsupervised Anomaly Filter**: Isolation Forest detects operational drift and out-of-distribution dynamics.
   - **Supervised Classifier**: Tuned Gradient Boosted Decision Trees (XGBoost) isolate specific failure modes.
4. **Prognostics Tier**: A deep bidirectional LSTM sequence network analyzes historical degradation trajectories over sliding temporal windows ($k=5$) to estimate RUL in operating hours.
5. **Interpretability & Digital Twin Synchronization**: TreeSHAP computes exact Shapley values $\phi_i$, mapping feature contributions to physical components visualized on an interactive digital twin schematic.

---

## 3. Track A Benchmark: UCI AI4I 2020 Predictive Maintenance Dataset

### 3.1 Dataset Overview & Provenance
- **Source**: UCI Machine Learning Repository (DOI: 10.24432/C5HS5C)
- **Primary Attribution**: S. Mathes (2020), AI4I 2020 Predictive Maintenance Dataset
- **Total Records**: 10,000 operational instances
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

The model catches 57 out of 68 true failure events while generating only 20 false alarms across 1,932 healthy cycles, achieving a balanced F1-score of 0.7862 in an extreme 28.5:1 imbalance regime.

### 3.4 Global SHAP Feature Importance Rankings

TreeSHAP global attribution ($	ext{mean}(|\phi_i|)$ across test samples):

1. **Rotational Speed [rpm]**: $\text{mean}(|\phi|) = 1.3314$ — Primary driver of power failure and speed instability.
2. **Tool Wear [min]**: $\text{mean}(|\phi|) = 1.2755$ — Dominant cumulative degradation marker triggering tool wear failure (TWF).
3. **Mechanical Power [W]**: $\text{mean}(|\phi|) = 1.2263$ — Calculated as $P = \tau \cdot \omega$; signals excessive operational loading.
4. **Overstrain Metric**: $\text{mean}(|\phi|) = 0.5984$ — Product of tool wear and torque; detects structural overstrain failure (OSF).
5. **Temperature Difference [K]**: $\text{mean}(|\phi|) = 0.5015$ — Heat dissipation indicator; signals heat dissipation failure (HDF).
6. **Torque [Nm]**: $\text{mean}(|\phi|) = 0.4996$ — Mechanical resistance indicator.
7. **Process Temperature [K]**: $\text{mean}(|\phi|) = 0.2971$ — Interface temperature tracking.
8. **Air Temperature [K]**: $\text{mean}(|\phi|) = 0.2453$ — Ambient temperature baseline.
9. **Product Type Code**: $\text{mean}(|\phi|) = 0.0646$ — Variant strain capacity (L/M/H).

---

## 4. Track B Benchmark: Three-Phase Induction Motor Digital Twin

### 4.1 Simulation Environment & Parameters
- **Rated Specifications**: 3 kW, 415 V line-to-line, 50 Hz supply, 4-pole, squirrel-cage induction motor.
- **Nominal Operating Speed**: 1,440 RPM (Nominal slip $s = 0.04$).
- **Telemetry Modalities**:
  1. Stator current ($I_a$, 10 kHz sampling frequency, 1-second analysis window of 10,000 samples).
  2. Tri-axial vibration ($a_x, a_y, a_z$, 5 kHz sampling frequency).
  3. Housing surface temperature ($T$, 1 Hz sampling frequency).
- **Simulated Load States**: 25%, 50%, 75%, and 100% full rated load.

### 4.2 Multi-Class Fault Classification Results

Five distinct machine operational conditions were classified across 312 held-out test runs:

| Operational State / Fault Mode | Precision | Recall | F1-Score | Test Support |
| :--- | :---: | :---: | :---: | :---: |
| **HEALTHY** | 76.92% | 41.67% | 54.05% | 24 |
| **BROKEN_ROTOR_BAR** | **100.00%** | **100.00%** | **1.0000** | 72 |
| **STATOR_INTER_TURN_SHORT**| **100.00%** | **100.00%** | **1.0000** | 72 |
| **BEARING_DEFECT** | 83.13% | 95.83% | 89.03% | 72 |
| **AIR_GAP_ECCENTRICITY** | **100.00%** | **100.00%** | **1.0000** | 72 |
| **Overall Macro Average** | **92.01%** | **87.50%** | **0.8862** | **312** |
| **Overall Accuracy** | — | — | **94.55%** | **312** |

#### Comparison with Baseline Classifiers:
- **XGBoost (Proposed)**: Accuracy = **94.55%**, Macro F1 = **0.8862**
- **Random Forest**: Accuracy = 92.63%, Macro F1 = 0.8018
- **Support Vector Machine (RBF)**: Accuracy = 87.82%, Macro F1 = 0.7366

### 4.3 Remaining Useful Life (RUL) Prognostics
- **Model Architecture**: 2-layer Bidirectional LSTM Sequence Regressor (Input dim: 26, Hidden dim: 64, Dropout: 0.2).
- **Sequence Length**: 5 consecutive operational temporal steps.
- **Mean Absolute Error (MAE)**: **0.2199 hours (~13.2 minutes)**
- **Root Mean Squared Error (RMSE)**: **0.2927 hours (~17.5 minutes)**
- **Baseline Ridge Linear Regressor MAE**: 0.3310 hours (33.5% error reduction achieved by the LSTM network).

### 4.4 Top Physical Feature Drivers (TreeSHAP on Motor Classifier)
1. **`current_harm_5_ratio`** (Importance: 0.3012): Discriminates stator inter-turn insulation degradation.
2. **`brb_sideband_ratio`** (Importance: 0.2874): Primary physical indicator of broken rotor bars at $f_1(1 \pm 2s)$.
3. **`vib_bpfo_energy`** (Importance: 0.2641): Ball pass frequency outer race harmonic surge detecting bearing fatigue.
4. **`eccentricity_sideband_amp`** (Importance: 0.2489): Stator/rotor geometric asymmetry indicator.
5. **`vib_crest_factor`** (Importance: 0.2105): Impulsive impact detection for rolling element degradation.

---

## 5. Offline Diagnostic Engine & Dual-Mode CSV Workflow

MACHINA-X features an offline analysis pipeline allowing maintenance engineers to ingest batch telemetry:
1. **Mode 1 (UCI AI4I Benchmark)**: Analyzes operational machine telemetry (`Air_temp`, `Process_temp`, `Speed`, `Torque`, `Tool_wear`, `Type`) and outputs binary failure predictions, risk tiers, and primary root-cause contributors.
2. **Mode 2 (Induction Motor 26-Feature MCSA)**: Analyzes pre-extracted MCSA current harmonics, vibration BPFO/BPFI energies, and thermal rise rates to output 5-class fault diagnoses, anomaly confidence, and estimated RUL.

Both modes enforce strict schema validation, providing actionable row-by-row error diagnostics and downloadable enriched CSVs containing prediction probabilities and prescriptive maintenance guidance.

---

## 6. Discussion, Limitations & Academic Integrity

### 6.1 Scientific Distinctions
It is essential to maintain rigorous scientific transparency regarding the datasets utilized:
- The **AI4I 2020 dataset** is an established synthetic benchmark modeling physical milling machine tool wear and stress distributions. It is not an experimental induction motor current dataset.
- The **Motor Digital Twin data** is generated via a dynamic physics-based mathematical simulation following the proposed 3 kW 415 V motor equations.
- Consequently, while the algorithmic pipeline, feature extraction, and explainability mechanisms are fully verified, **physical experimental testbed validation with hardware sensors remains the immediate next step** before direct deployment in safety-critical manufacturing environments.

### 6.2 Prescriptive Maintenance Action Matrix
- **Broken Rotor Bar Detected**: Schedule rotor core inspection; monitor 2s sideband amplitude; limit full-load acceleration cycles.
- **Stator Inter-Turn Short**: Immediate de-energization advised; perform insulation resistance (megger) and surge testing to prevent catastrophic phase-to-phase flashover.
- **Bearing Defect**: Schedule acoustic lubrication replenishment; monitor high-frequency acceleration envelope; replace rolling element if BPFO energy exceeds threshold.
- **Air-Gap Eccentricity**: Perform laser alignment and soft-foot inspection; verify static dynamic rotor concentricity.

---

## 7. Conclusions

The MACHINA-X framework demonstrates that explainable artificial intelligence can be effectively coupled with cyber-physical digital twins to achieve both high predictive accuracy and operational interpretability. By delivering 98.45% accuracy on standard benchmark data, 94.55% multi-fault accuracy on induction motor dynamics, and instantaneous SHAP feature attributions, MACHINA-X provides industrial operators with actionable, transparent, and trustworthy maintenance decision support.

---
*Report generated automatically from verified model checkpoints by MACHINA-X Research Utilities.*
