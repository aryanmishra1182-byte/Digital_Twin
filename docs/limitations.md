# Project Limitations & Scientific Caveats

## 1. Simulation vs. Real Physical Asset Dynamics
- All training and validation datasets in this demonstration were produced using mathematical simulation models based on the proposed IEEE configuration.
- The simulator models known first-order physical phenomena (broken rotor bar sidebands, bearing BPFO/BPFI impacts, stator turn heating, and air-gap eccentricity). However, it does not capture higher-order physical nonlinearities such as magnetic saturation harmonics, cage bar cross-currents, inverter PWM switching noise, or complex structural acoustic resonances.
- **A model achieving 94.55% accuracy on synthetic telemetry cannot be represented as experimentally validated on operational physical machinery.** Physical bench test validation represents a subsequent research milestone.

## 2. Prognostic RUL Constraints
- The Remaining Useful Life (RUL) target is generated from an assumed non-linear degradation trajectory ($W(t) = (t / T)^{1.8}$).
- The evaluated MAE of 0.22 hours demonstrates that the LSTM sequence regressor accurately tracks this simulated trajectory; it does not constitute proof of real-world motor lifetime prognostic capability.

## 3. Explainability Scope (SHAP)
- SHAP TreeExplainer attributes credit to input features based on cooperative game theory Shapley values.
- Attributions represent statistical model dependency, not physical causality. While qualitative physics consistency was verified (e.g. sideband features dominating broken rotor bar predictions), anomalous external conditions or sensor faults could yield misleading explanations if not cross-validated by a qualified reliability engineer.

## 4. Advisory Safety Boundary
- Recommendations emitted by the advisory engine are advisory decision-support aids for maintenance planners.
- The framework does NOT directly control machine contactors, VFD inverters, or safety shutdown circuits.
