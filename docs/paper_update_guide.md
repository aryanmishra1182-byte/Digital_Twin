# MACHINA-X: Comprehensive IEEE Research Paper Update Guide
## Bridging Conceptual Architectural Proposals to Empirical Experimental Validation

**Target Document**: IEEE Research Paper (`docs/extracted_paper_text.txt`)  
**Paper Title**: *An Explainable Digital Twin Framework for Predictive Maintenance of Three Phase Induction Motors*  
**Authors**: Aditya Gupta, Aditya Maurya, Ananya Sharma, Aryan Mishra  
**Supervisor / Mentor**: Ms. Monika Sharma  
**Date of Revision Guide**: October 2026  

---

## 1. Executive Summary & Audit of Original Manuscript

The original research manuscript was authored as a **conceptual and architectural proposal** ("This work proposes...", "TABLE VI: Current Development Status — claims no numerical performance results"). It outlined an edge-to-dashboard pipeline, mathematical formulations for Motor Current Signature Analysis (MCSA), and an evaluation protocol.

With the completion of **MACHINA-X**, all conceptual milestones have been experimentally realized, empirically evaluated, and packaged into a functional cyber-physical software platform.

This guide provides **exact, drop-in replacement paragraphs and data tables** for each section of the IEEE paper. By adopting these revisions, the paper transitions from a preliminary design proposal to an **authoritative, empirical research publication** backed by verified machine learning checkpoints and reproducible benchmark data.

---

## 2. Evidence Mapping: Proposed Concepts vs. Empirical Realization

| Paper Section / Component | Original Manuscript Status | MACHINA-X Implemented Reality | Key Empirical Metric |
| :--- | :--- | :--- | :--- |
| **Abstract** | Future-tense proposal ("This work proposes...") | Past-tense empirical validation of dual-track digital twin | AI4I Acc: 98.45%, Motor Acc: 94.55%, RUL MAE: 0.22 hrs |
| **Table I (Prior Work Comparison)** | Marked column as **P** (Planned / Proposed) | Change **P** to **✓** (Implemented & Evaluated) | Full 5-stage pipeline operational |
| **Benchmark Track A (AI4I)** | Not mentioned in initial draft | Rigorous validation on UCI AI4I 2020 dataset (10,000 instances) | Champion XGBoost: F1 = 0.7862, ROC-AUC = 0.9808 (28.5:1 imbalance) |
| **Benchmark Track B (Motor)** | Proposed Simulink model (Table II) | Physics-guided simulation (3 kW, 415 V, 4-pole, 26 features) | XGBoost 5-Class: 94.55% Acc, Macro F1 = 0.8862 |
| **RUL Estimation (Stage 3)** | Proposed LSTM architecture | Unidirectional 2-layer LSTM Sequence Regressor ($k=5$) | MAE: 0.2199 hrs (~13.2 min), 33.5% gain over Ridge |
| **Explainability (SHAP)** | Proposed TreeExplainer application | Exact TreeSHAP local waterfall & global rankings | Rotational Speed (1.3314), Tool Wear (1.2755), Power (1.2263) |
| **Table VI (Status)** | Placeholder: "claims no numerical results" | **Replace with complete Tables IV-A and IV-B** | Full baseline comparisons and confusion matrices |
| **Conclusion** | Stated "next phase will generate dataset" | Replaced with concluded findings and testbed recommendations | Conclusive empirical contributions verified |

---

## 3. Section-by-Section Drop-in Revisions

### 3.1 Title and Abstract Revision

> **Action**: Replace the Abstract in lines 2–4 of `extracted_paper_text.txt` with the following:

```markdown
Abstract—Three-phase induction motors are the foundational prime movers of modern industrial manufacturing, where unpredicted catastrophic failures cause substantial operational downtime and economic losses. Conventional maintenance strategies either incur run-to-failure operational risks or result in premature component retirement via fixed-interval preventive servicing. While prior research has investigated digital twins, fault classification, and explainable artificial intelligence (XAI) independently, an integrated cyber-physical framework bridging real-time signal processing, multi-stage machine learning inference, and transparent game-theoretic explainability has remained an open challenge.

This paper presents MACHINA-X, a functional explainable digital twin framework for condition monitoring, multi-fault diagnostics, and remaining useful life (RUL) estimation. The platform incorporates a physics-guided feature extraction engine that computes 26 Motor Current Signature Analysis (MCSA), vibration harmonic, and thermal dynamic indicators. The diagnostic pipeline is validated across two empirical tracks: (1) a benchmark on the official UCI AI4I 2020 Predictive Maintenance dataset (10,000 synthetic milling-machine instances, Stephan Matzka, 2020), where our tuned XGBoost classifier achieves 98.45% accuracy, an F1-score of 0.7862, and an ROC-AUC of 0.9808 under extreme 28.5:1 class imbalance, outperforming Logistic Regression, Decision Tree, and Random Forest baselines; and (2) a cyber-physical induction motor simulation modeling a 3 kW, 415 V, four-pole motor across five operating states, attaining 94.55% multi-class accuracy across 312 windows from 52 held-out runs and an RUL prediction Mean Absolute Error (MAE) of 0.2199 hours via a 2-layer LSTM sequence network across 4 held-out degradation trajectories.

Crucially, local and global TreeSHAP explainability layers are integrated directly into the digital twin, mapping feature attributions to physical machine components on an interactive operator dashboard. An offline dual-mode batch diagnostic engine is also delivered to support non-streaming legacy telemetry. The results demonstrate that coupling physics-informed feature extraction with explainable gradient boosted trees and recurrent networks delivers both high diagnostic fidelity and actionable operator interpretability.

Keywords—Digital Twin; Explainable AI; SHAP; Predictive Maintenance; Three-Phase Induction Motor; Motor Current Signature Analysis; Remaining Useful Life; XGBoost; LSTM.
```

---

### 3.2 Section I (Introduction) Revision

> **Action**: Update the four contributions listed in paragraph 4 of Section I (line 9) to reflect empirical delivery:

```markdown
The paper offers four primary contributions:
1. Architectural Delivery: We design and implement an end-to-end cyber-physical digital twin architecture connecting sensor ingestion, edge preprocessing, Spring Boot synchronization, and an interactive React dashboard.
2. Physics-Guided Feature Pipeline: We formalize a 26-feature descriptor set combining MCSA sidebands (f_br = f_1(1 ± 2s)), bearing defect characteristic frequencies (BPFO, BPFI), vibration crest factor/kurtosis, and thermal rise rates.
3. Rigorous Dual-Track Empirical Validation: We evaluate the framework both against the 10,000-instance UCI AI4I 2020 industrial benchmark (achieving 98.45% accuracy and 0.7862 F1-score) and against a multi-state 3 kW induction motor twin (achieving 94.55% fault classification accuracy and 0.22 hours RUL MAE).
4. Grounded Explainability & Batch Diagnostics: We embed exact TreeSHAP attributions directly into the digital twin state update and provide an offline dual-mode CSV ingestion engine with automated schema verification and prescriptive maintenance guidance.
```

---

### 3.3 Section II & Table I Revision

> **Action**: In Table I (line 20), change the final row representing the proposed work:
- Change the Status label from **P (Proposed)** to **✓ (Validated)**.
- Digital Twin: **✓**
- Staged ML Pipeline (Anomaly + Fault + RUL): **✓**
- Three-Phase Induction Motor Validation: **✓ (Simulated IEEE Spec & AI4I Benchmark)**
- Explainable AI (SHAP): **✓ (TreeSHAP Local & Global)**

---

### 3.4 Section V (Methodology) Revisions

> **Action**: In Section V-C (Staged Machine Learning Pipeline), specify the exact champion hyperparameters and configurations utilized:

```markdown
C. Staged Machine Learning Pipeline Implementation
Stage 1 (Anomaly Detection): An unsupervised Isolation Forest with 150 estimators and 0.05 contamination threshold filters nominal operating telemetry from anomalous drift.
Stage 2 (Fault Classification): An optimized Gradient Boosted Decision Tree (XGBoost) with 120 estimators, learning rate η = 0.08, maximum depth = 5, and subsample ratio = 0.85 is deployed as the champion classifier. It isolates five discrete states: Healthy, Broken Rotor Bar, Stator Inter-Turn Short, Bearing Defect, and Air-Gap Eccentricity.
Stage 3 (RUL Prognostics): A unidirectional 2-layer LSTM network with 32 hidden units, dropout rate of 0.10, and Adam optimizer (learning rate = 5e-3) evaluates sliding sequences of length k = 5 consecutive operational windows over 40 epochs (batch size 32) to regress remaining operating hours.
```

---

### 3.5 Section VI (Experimental Evaluation & Results) — Major Replacement

> **Action**: Replace Section VI (lines 52–60) and delete Table VI (placeholder). Insert the complete empirical results below:

```markdown
VI. Experimental Evaluation and Empirical Results

A. Track A Benchmark: UCI AI4I 2020 Predictive Maintenance Dataset
To benchmark the classification and explainability architecture under extreme class imbalance, the pipeline was evaluated on the official UCI AI4I 2020 dataset (10,000 synthetic milling-machine instances, Stephan Matzka, 2020, 339 failure events, 28.5:1 imbalance). An 80/20 stratified train/test split was utilized alongside 5-fold cross-validation on the training set. Table IV summarizes the comparative performance across four machine learning paradigms.

TABLE IV-A. Comparative Model Performance on UCI AI4I 2020 Held-Out Test Set (N=2,000)
----------------------------------------------------------------------------------------------------------------
Model Architecture               Accuracy   Precision   Recall   F1-Score   ROC-AUC   5-Fold CV F1 (Mean ± Std)
----------------------------------------------------------------------------------------------------------------
Logistic Regression (Baseline)    85.75%     17.80%     88.24%    0.2963     0.9393       0.2719 ± 0.0126
Decision Tree (Baseline)          95.00%     38.89%     82.35%    0.5283     0.8568       0.5530 ± 0.0153
Random Forest                     98.40%     74.32%     80.88%    0.7746     0.9831       0.8246 ± 0.0374
XGBoost Classifier (Champion)     98.45%     74.03%     83.82%    0.7862     0.9808       0.7775 ± 0.0245
----------------------------------------------------------------------------------------------------------------

On the held-out test split of 2,000 samples (containing 68 true failures), the Champion XGBoost model yielded 1,912 True Negatives, 57 True Positives, 20 False Positives, and 11 False Negatives. This corresponds to a specificity of 98.96% and sensitivity of 83.82%.

TreeSHAP global attributions identified the primary drivers of failure across the dataset:
1. Rotational Speed [rpm] (mean |SHAP| = 1.3314): Primary indicator of spindle speed anomalies and power failure (PWF).
2. Tool Wear [min] (mean |SHAP| = 1.2755): Dominant cumulative degradation marker triggering tool wear failure (TWF).
3. Mechanical Power [W] (mean |SHAP| = 1.2263): Physical product of torque and speed (P = τ · ω).
4. Overstrain Metric (mean |SHAP| = 0.5984): Product of torque and tool wear; identifies overstrain failure (OSF).
5. Temperature Difference [K] (mean |SHAP| = 0.5015): Heat dissipation gradient signaling thermal failure (HDF).

B. Track B Benchmark: Three-Phase Induction Motor Digital Twin
Track B evaluates the 26 physics-guided features extracted from the 3 kW, 415 V motor simulation across 312 windows from 52 held-out runs (6 windows/run).

TABLE IV-B. Multi-Class Fault Classification Performance (312 Windows from 52 Held-Out Runs)
------------------------------------------------------------------------------------------------
Fault Mode / Operating State       Precision      Recall      F1-Score      Test Windows (Runs)
------------------------------------------------------------------------------------------------
HEALTHY                              76.92%       41.67%       0.5405            24 (4 runs)
BROKEN_ROTOR_BAR                    100.00%      100.00%       1.0000            72 (12 runs)
STATOR_INTER_TURN_SHORT             100.00%      100.00%       1.0000            72 (12 runs)
BEARING_DEFECT                       83.13%       95.83%       0.8903            72 (12 runs)
AIR_GAP_ECCENTRICITY                100.00%      100.00%       1.0000            72 (12 runs)
------------------------------------------------------------------------------------------------
Macro Average                        92.01%       87.50%       0.8862           312 (52 runs)
Overall Accuracy                       —            —          94.55%           312 (52 runs)
------------------------------------------------------------------------------------------------

The XGBoost classifier achieved an overall multi-class accuracy of 94.55% (Macro F1 = 0.8862), outperforming Random Forest (92.63% accuracy, 0.8018 F1) and Support Vector Machine (87.82% accuracy, 0.7366 F1). Perfect discrimination was achieved for broken rotor bars, stator turn shorts, and eccentricity, owing to the distinctive spectral signatures of MCSA sidebands in the simulation model.

C. Remaining Useful Life (RUL) Prognostics
The unidirectional 2-layer LSTM regressor was evaluated across 384 degradation sequence windows (sequence length k = 5) from 4 held-out runs. The model attained:
- Mean Absolute Error (MAE): 0.2199 hours (~13.2 minutes)
- Root Mean Squared Error (RMSE): 0.2927 hours (~17.5 minutes)
Compared to a linear Ridge regression baseline (MAE: 0.3310 hours, RMSE: 0.4627 hours) and a naive mean baseline (MAE: 12.02 hours), the recurrent architecture achieved a 33.5% reduction in prediction error. Per-run MAE across the four runs: RUL_BRO_03 (0.2093 h), RUL_STA_03 (0.1885 h), RUL_BEA_03 (0.2453 h), and RUL_AIR_03 (0.2367 h).

D. Robustness and Cross-Load Generalization
1. Multi-Seed Stability (5 seeds: [42, 101, 2024, 7, 999]):
   - Classifier Accuracy: 94.87% ± 0.83%
   - Classifier Macro F1: 0.9001 ± 0.0170
   - Stage 1 Anomaly F1: 0.1139 ± 0.0063 (at nominal 0.05 contamination on imbalanced test set)
2. Leave-One-Load-Out Generalization (train on 3 loads, test on held-out load):
   - 25% Load: 67.31% Acc (Macro F1: 0.6104)
   - 50% Load: 67.31% Acc (Macro F1: 0.5327)
   - 75% Load: 75.64% Acc (Macro F1: 0.7220)
   - 100% Load: 73.08% Acc (Macro F1: 0.5835)
   - Mean Cross-Load Accuracy: 70.83% (Macro F1: 0.6121)
```

---

### 3.6 Section VII (Practical Considerations & Limitations) Revision

> **Action**: Strengthen Section VII with explicit academic integrity and physical validation disclosures:

```markdown
VII. Practical Considerations, Limitations, and Threats to Validity

A. Scientific Distinction of Benchmarks
To maintain strict scientific fidelity, the two empirical tracks must be distinguished:
1. The UCI AI4I 2020 dataset represents milling machine tool wear mechanics and validates the mathematical robustness of the staged pipeline and TreeSHAP under severe class imbalance; it does not model electrical motor current.
2. The motor telemetry dataset was produced via physics-based mathematical differential simulation conforming to IEEE 3 kW motor specifications. While spectral harmonic signatures and thermal dynamics are accurately synthesized, physical dynamometer testbed measurements are necessary to calibrate the models against ambient industrial electrical noise and sensor drift.

B. Measured Hardware Inference Latency
Over 500 consecutive operational 1-second windows on host hardware (AMD Ryzen 5 4600H, Windows 10, Python 3.10), full end-to-end inference (feature extraction + Stage 1 Isolation Forest + Stage 2 XGBoost + TreeSHAP) averaged 17.43 ms (median p50: 16.68 ms, 95th percentile p95: 21.32 ms). Because inference latency is well below the 1,000 ms acquisition window, the architecture satisfies real-time execution constraints without queuing delay or telemetry backpressure.

C. Known Empirical Weaknesses Disclosed
1. Healthy Class Recall (41.67%): The Stage 2 classifier achieved 41.67% recall on healthy operation due to a 12:1 imbalance against healthy runs in training (48 healthy vs 576 faulty windows), biasing boundary decisions toward mild bearing defect.
2. Stage 1 Anomaly Recall (72.57%): Unsupervised Isolation Forest missed 79 faulty windows (recall 72.57%) due to nominal 0.05 contamination.
3. Idealized Simulation: Perfect scores on rotor bar, stator short, and eccentricity reflect deterministic mathematical simulation without inverter carrier harmonics.
```

---

### 3.7 Section IX (Conclusion) Revision

> **Action**: Replace the future-tense concluding paragraph (lines 70–71) with the finalized research summary:

```markdown
IX. Conclusion

This paper has presented and experimentally validated MACHINA-X, an explainable cyber-physical digital twin framework for predictive maintenance of industrial equipment. By combining 26 physics-guided features from Motor Current Signature Analysis (MCSA), vibration harmonics, and thermal dynamics with a staged machine learning pipeline and TreeSHAP explainability, the system delivers trustworthy decision support to maintenance personnel. 

The framework demonstrated 98.45% accuracy and an F1-score of 0.7862 on the official UCI AI4I 2020 synthetic benchmark under severe class imbalance, 94.55% multi-class fault classification accuracy across 312 windows from 52 held-out runs of induction motor dynamics, and an RUL prediction MAE of 0.2199 hours via LSTM sequence regression. In addition, an offline dual-mode batch diagnostic engine was delivered to bridge legacy telemetry workflows. Future work will focus on deploying the edge inference pipeline onto a physical 3 kW motor dynamometer testbed to evaluate sensor noise resilience and cross-machine domain adaptation.
```

---

## 4. Manuscript Submission Checklist for Authors

- [x] **Title & Abstract Updated**: Changed to reflect empirical delivery and exact quantitative metrics.
- [x] **Table I (Prior Art) Updated**: Replaced planned indicator with verified checkmark.
- [x] **Table IV-A Added**: Four-model comparison on UCI AI4I 2020 benchmark with 5-fold CV.
- [x] **Table IV-B Added**: 5-class fault classification metrics on induction motor simulation.
- [x] **Section V Hyperparameters Documented**: XGBoost, Isolation Forest, and LSTM exact settings recorded.
- [x] **Section VI RUL Results Documented**: MAE (0.22 hrs) and RMSE (0.29 hrs) compared against Ridge baseline.
- [x] **Section VII Integrity Disclosures Added**: Clear separation of AI4I synthetic benchmark vs. motor simulation vs. future physical bench experiments.
- [x] **Standalone Document Generated**: Full standalone DOCX and Markdown report generated in `docs/reports/` for immediate download and review.
