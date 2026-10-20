# Model Card: Explainable Digital Twin ML Suite

## Model Details
- **Suite**: Stage 1 Anomaly Detection, Stage 2 Fault Classification, Stage 3 Remaining Useful Life (RUL) Regressor, Stage 4 SHAP Explainer.
- **Developers**: Research Team (Aditya Gupta, Aditya Maurya, Ananya Sharma, Aryan Mishra; Supervisor: Ms. Monika Sharma).
- **Target Motor**: 3 kW, 415 V, 50 Hz, 4-Pole Squirrel-Cage Induction Motor.
- **Model Versions**:
  - `iso_forest_v1.0` (Isolation Forest)
  - `xgboost_classifier_v1.0` (XGBoost Multiclass)
  - `lstm_rul_v1.0` (PyTorch 2-Layer LSTM Sequence Regressor)
  - `shap_v0.49` (TreeExplainer)

## Intended Use
- **Primary Use**: Predictive condition monitoring and early fault diagnosis in three-phase induction motors driving industrial equipment (feed pumps, fans, compressors).
- **Out of Scope**: Not intended for direct automated machine tripping or life-critical machinery emergency stops without hardware interlocks.

## Training Data & Partitioning
- **Data Source**: Synthetic simulation based on deterministic physics models (broken rotor bar sideband equation, bearing BPFO/BPFI geometry, stator turn short negative sequence heating).
- **Leakage Prevention**: Strictly partitioned at the **simulation run level** (Train: 624 windows across 2 runs per condition; Validation: 312 windows across 1 run; Test: 312 windows across 1 run).
- **Features**: 26 physics-guided features extracted from 10 kHz current and vibration signals.

## Evaluation Results
| Model | Algorithm | Primary Metric | Baseline Comparison |
|---|---|---|---|
| Stage 1 | Isolation Forest | Precision: 0.9905, Recall: 0.7257, F1: 0.8377 | FPR: 8.33% on healthy |
| Stage 2 | XGBoost | Accuracy: 94.55%, F1-macro: 0.8862 | Random Forest: 92.63%, SVM: 87.82% |
| Stage 3 | PyTorch LSTM | MAE: 0.22 hours, RMSE: 0.29 hours | Ridge Regression: MAE 0.33 hours |
| Explainability | SHAP TreeExplainer | 26 Feature attributions | Aligns with physics sideband equations |

## Limitations
- Performance on simulated degradation trajectories measures agreement with the mathematical simulation target, not physical bearing degradation across varying industrial lubrication types.
- Field deployment on physical hardware requires bench recalibration and domain adaptation.
