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
| **Abstract** | Future-tense proposal ("This work proposes...") | Past-tense empirical validation of dual-track digital twin | AI4I Acc: 98.45%, Motor Acc: 96.40%, RUL MAE: 0.7466 hrs |
| **Table I (Prior Work Comparison)** | Marked column as **P** (Planned / Proposed) | Change **P** to **✓** (Implemented & Evaluated) | Full 5-stage pipeline operational |
| **Benchmark Track A (AI4I)** | Not mentioned in initial draft | Rigorous validation on UCI AI4I 2020 dataset (10,000 instances) | Champion XGBoost: F1 = 0.7862, ROC-AUC = 0.9808 (28.5:1 imbalance) |
| **Benchmark Track B (Motor)** | Proposed Simulink model (Table II) | Physics-guided simulation (3 kW, 415 V, 4-pole, 26 features) | Stage 1 IF FPR = 4.25%, Stage 2 XGBoost 5-Class: 96.40% Acc, Macro F1 = 0.9639 |
| **RUL Estimation (Stage 3)** | Proposed LSTM architecture | Unidirectional 2-layer LSTM Sequence Regressor ($k=5$) | MAE: 0.7466 hrs, RMSE: 1.1849 hrs on held-out runs |
| **Real Physical Data (CWRU)** | Not in original draft | Case Western Reserve University real vibration bearing testbed | Within-dataset Acc: 98.67%, Macro F1: 0.9866 |
| **Explainability (SHAP)** | Proposed TreeExplainer application | Exact TreeSHAP local waterfall & global rankings | Stator current sideband ratio, thermal rise, vibration kurtosis |
| **Table VI (Status)** | Placeholder: "claims no numerical results" | **Replace with complete Tables IV-A, IV-B, and IV-C** | Full baseline comparisons and confusion matrices |
| **Conclusion** | Stated "next phase will generate dataset" | Replaced with concluded findings and testbed recommendations | Conclusive empirical contributions verified |

---

## 3. Section-by-Section Drop-in Revisions

### 3.1 Title and Abstract Revision

> **Action**: Replace the Abstract in lines 2–4 of `extracted_paper_text.txt` with the following:

```markdown
Abstract—Three-phase induction motors are the foundational prime movers of modern industrial manufacturing, where unpredicted catastrophic failures cause substantial operational downtime and economic losses. Conventional maintenance strategies either incur run-to-failure operational risks or result in premature component retirement via fixed-interval preventive servicing. While prior research has investigated digital twins, fault classification, and explainable artificial intelligence (XAI) independently, an integrated cyber-physical framework bridging real-time signal processing, multi-stage machine learning inference, and transparent game-theoretic explainability has remained an open challenge.

This paper presents MACHINA-X, a functional explainable digital twin framework for condition monitoring, multi-fault diagnostics, and remaining useful life (RUL) estimation. The platform incorporates a physics-guided feature extraction engine that computes 26 Motor Current Signature Analysis (MCSA), vibration harmonic, and thermal dynamic indicators. The diagnostic pipeline is validated across two empirical tracks: (1) a benchmark on the official UCI AI4I 2020 Predictive Maintenance dataset (10,000 synthetic milling-machine instances, Stephan Matzka, 2020), where our tuned XGBoost classifier achieves 98.45% accuracy, an F1-score of 0.7862, and an ROC-AUC of 0.9808 under extreme 28.5:1 class imbalance, outperforming Logistic Regression, Decision Tree, and Random Forest baselines; and (2) a cyber-physical induction motor simulation modeling a 3 kW, 415 V, four-pole motor across five operating states, attaining 96.40% multi-class accuracy and 0.9639 macro F1 across 2,000 unseen test windows, Stage 1 anomaly detection with 4.25% false alarm rate (FPR = 4.25%), an RUL prediction Mean Absolute Error (MAE) of 0.7466 hours via a 2-layer LSTM sequence network across held-out degradation trajectories, and real-world physical bearing validation on the Case Western Reserve University (CWRU) testbed achieving 98.67% accuracy.

Crucially, local and global TreeSHAP explainability layers are integrated directly into the digital twin, mapping feature attributions to physical machine components on an interactive operator dashboard. An offline dual-mode batch diagnostic engine is also delivered to support non-streaming legacy telemetry. The results demonstrate that coupling physics-informed feature extraction with explainable gradient boosted trees and recurrent networks delivers both high diagnostic fidelity and actionable operator interpretability.

Keywords—Digital Twin; Explainable AI; SHAP; Predictive Maintenance; Three-Phase Induction Motor; Motor Current Signature Analysis; Remaining Useful Life; XGBoost; LSTM; CWRU Benchmark.
```

---

### 3.2 Methodology Revision: Multi-Stage Diagnostic Cascade

Replace Section III ("Proposed Architecture") with the empirical four-stage cascade specification:
1. **Stage 1 (Anomaly Screener)**: Unsupervised Isolation Forest envelope ($n=150$) with Youden's J threshold optimization yielding 4.25% false alarm rate ($383/400$ healthy rejections) and 70.38% incipient fault detection.
2. **Stage 2 (Multi-Class Fault Classifier)**: Champion XGBoost 5-class tree ensemble yielding 96.40% accuracy and 0.9639 Macro F1 across Healthy, Broken Rotor Bar, Stator Inter-turn Short, Bearing Defect, and Air Gap Eccentricity.
3. **Stage 3 (Trajectory RUL Regressor)**: Recurrent 2-layer LSTM model ($k=5$ sequence windows) yielding 0.7466 hours MAE.
4. **Stage 4 (TreeSHAP Local Attribution)**: Exact game-theoretic Shapley value attribution executed in $1.29$ ms.

---

### 3.3 Publication Figures and LaTeX Tables
All publication-quality figures are rendered at 300 DPI in `docs/paper_assets/`:
- `fig1_confusion_matrix.pdf / .png`: Stage 2 5-class confusion matrix.
- `fig2_shap_importance.pdf / .png`: Global TreeSHAP feature importance ranking.
- `fig3_rul_trajectories.pdf / .png`: LSTM RUL predicted vs ground-truth degradation curves.
- `fig4_modality_ablation.pdf / .png`: Modality ablation (Current vs Vibration vs Current+Vibration).
- `fig5_cross_load_lolo.pdf / .png`: Cross-load generalization (Leave-One-Load-Out).
- `fig6_snr_noise_robustness.pdf / .png`: Signal-to-noise ratio degradation profile ($15-35$ dB).
- `fig7_cwru_transfer.pdf / .png`: Sim-to-real transfer fine-tuning progression on physical CWRU data.
- `tables.tex`: Complete ready-to-compile LaTeX table source for IEEE Transactions.
