# MACHINA-X: One-Page Research & Engineering Summary

**Project Title:** MACHINA-X: An Explainable AI-Driven Digital Twin Framework for Predictive Maintenance of Industrial Equipment  
**Lead Engineer / Researcher:** Aryan Mishra  
**Target Domain:** Three-Phase Induction Motors & Industrial Rotary Equipment  
**Repository Architecture:** React 18 + Vite (Frontend), Spring Boot 3.3.4 (Backend), FastAPI 0.115 + Scikit-Learn/PyTorch/XGBoost (ML Engine)  

---

## 1. What MACHINA-X Actually Is (and Is Not)

- **What It Is:** A fully functional, production-engineered end-to-end predictive maintenance platform. Real telemetry windows or mathematically simulated electrical/vibrational waveforms flow through a 26-feature physics extraction engine, a 2-stage anomaly-and-classification inference pipeline, a unidirectional LSTM degradation regressor, a Fast TreeSHAP local explainer, and a Spring Boot Digital Twin synchronization service with hysteresis-guarded alert advisories.
- **What It Is Not:** A UI mock-up, a collection of disconnected Jupyter notebooks, or an unvalidated claim of experimental factory deployment. All metrics cited in this project originate from deterministic, reproducible benchmark runs recorded in JSON artifacts.

---

## 2. Experimental Rigor: What Was Simulated vs. What Was Physically Measured

| Domain Component | Data Provenance | Real Physics vs Simulation | Evidence & Artifact Location |
| :--- | :--- | :--- | :--- |
| **Three-Phase Motor Waveforms** | High-fidelity ODE Simulation | **Explicit Simulation**: 3 kW, 415 V, 50 Hz, 4-pole motor ($s=0.04$). Injected voltage unbalance ($0-3\%$), speed wander ($\pm 10$ RPM), sensor drift, and noise ($15-35$ dB SNR). | `data/processed/dataset_full.csv`, `ml/datasets/dataset_generator.py` |
| **Real Bearing Fault Data** | Case Western Reserve University (CWRU) | **Physical Accelerometer Measurements**: Reliance Electric 2 HP motor, deep groove SKF bearings, 12 kHz sampled, polyphase resampled to 10 kHz. File-level train/test split. | `data/cwru/*.mat`, `ml/artifacts/real_data_cwru_metrics.json` |
| **Milling Tool Degradation** | UCI AI4I 2020 Predictive Maintenance | **Synthetic Physical Milling Benchmark**: 10,000 machine operating instances modeling thermal dissipation, tool wear, and torque failure modes. | `data/ai4i2020/ai4i2020.csv`, `ml/artifacts/ai4i/` |
| **Computational Latency** | Direct Hardware Profiling | **Empirical Hardware Benchmarks**: 500 timed runs on AMD Ryzen 5 CPU; Locust concurrent load testing on FastAPI service. | `ml/artifacts/latency_metrics.json`, `ml/artifacts/locust_benchmark.json` |

---

## 3. Key Experimental Results (Source of Truth)

All numbers below are synchronized via `scripts/generate_paper_numbers.py` and validated by automated tests (`tests/test_paper_numbers_sync.py`):

1. **Stage 1 Incipient Anomaly Detection (Isolation Forest):**
   - **Test Recall:** 99.12% (793 of 800 faulty windows correctly flagged).
   - **Test F1-Score:** 0.8855 | **ROC-AUC:** 0.8461 | **Median Latency:** 10.71 ms.
   - *Baseline Comparison:* PyTorch Autoencoder achieved 97.44% Recall, 0.8919 F1, 0.8556 ROC-AUC (optimal validation threshold = 0.000783).
2. **Stage 2 Multiclass Fault Classification (2,000 Unseen Test Windows across 200 Runs):**
   - **XGBoost (Champion):** **Accuracy: 96.40%**, **Macro F1: 0.9639**, **Healthy Class Recall: 85.00%**. Median latency: 1.04 ms.
   - *Baseline Comparisons:* Random Forest (Acc: 95.70%, F1: 0.9570, Latency: 7.85 ms); RBF SVM (Acc: 91.25%, F1: 0.9147, Latency: 0.52 ms); 1-D Raw Signal Waveform CNN (Acc: 81.00%, F1: 0.7823, Latency: 2.05 ms).
   - *Model Selection Rule:* XGBoost algorithmically selected over Random Forest because its Macro F1 is within 0.02 and its latency is $7.5\times$ faster (1.04 ms vs 7.85 ms).
3. **Stage 3 Remaining Useful Life (RUL) Trajectory Regression:**
   - **LSTM Sequence Regressor (Champion):** **MAE: 0.7466 hours**, **RMSE: 1.1849 hours** on multi-law degradation curves (linear, exponential, power-law $\gamma \in [1.4, 2.6]$).
   - *Baseline Comparison:* Ridge Regressor (MAE: 1.300 h, RMSE: 1.761 h); Mean Baseline (MAE: 12.00 h).
4. **Physical Transferability (CWRU 12k Bearing Benchmark):**
   - **Within-Dataset Supervised:** Accuracy: 98.57%, Macro F1: 0.9857 (Loads 0-1 for training, Load 3 for held-out test).
   - **Sim-to-Real Zero-Shot:** 57.14% accuracy (due to domain discrepancy between simulated induction motor current/vibration models and physical Reliance motor accelerometer dynamics).
   - **Few-Shot Fine-Tuning:** Adding just 10 real physical windows raises accuracy to **81.57% $\pm$ 4.63%** across 10 random seeds.
5. **System Scalability & Throughput:**
   - Locust load testing demonstrated **26.10 requests/second** throughput with 0 failures (0.00% failure rate) and 32.0 ms median response time under 10 concurrent active simulated operators.

---

## 4. Honest Technical Limitations & Scientific Disclosures

1. **Synthetic Motor Simulation Baseline:**
   - While supply voltage unbalance, speed wander, sensor drift, and noise were injected, simulated induction motor equations represent idealized electromagnetic harmonics. Physical motor windings suffer from manufacturing asymmetries, harmonic distortion from variable-frequency drive (VFD) PWM switching, and unmodeled mechanical resonances.
2. **Domain Gap in Zero-Shot Transfer:**
   - As revealed by our CWRU transfer evaluation, a model trained purely on synthetic induction motor equations achieves only 57.14% zero-shot transfer on physical accelerometer data. While 10 fine-tuning windows elevate accuracy to 81.57%, zero-shot physical transfer without domain adaptation remains an unsolved industrial challenge.
3. **Load-Dependent Spectral Generalization:**
   - Under Leave-One-Load-Out (LOLO) cross-validation, accuracy decreases to 70.42% because MCSA sideband harmonic frequencies $f_{br} = f_1(1 \pm 2s)$ scale directly with rotor slip $s$, which is load-dependent.
4. **Advisory Safety Boundary:**
   - MACHINA-X is designed as an operator decision-support system. It generates P1/P2/P3 alerts with hysteresis suppression (escalating only after $\ge 2$ consecutive anomalies and de-escalating after $\ge 3$ consecutive normal windows) and does not directly actuate safety-critical circuit breakers.
