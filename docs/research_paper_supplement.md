# Supplementary Research Results: Explainable Digital Twin Framework for Predictive Maintenance

**Target Publication:** IEEE Transactions on Industrial Informatics / IEEE Access  
**Working Title:** *An Explainable AI-Driven Digital Twin Framework for Predictive Maintenance of Industrial Equipment*  
**Authors:** Aditya Gupta, Aditya Maurya, Ananya Sharma, Aryan Mishra  
**Affiliation:** Industrial Predictive Maintenance and Digital Twin Research Initiative  
**Date of Experimentation:** October 2026  
**Reproducibility Repository:** `https://github.com/aryanmishra1182-byte/Digital_Twin`

---

## 1. Abstract & Scope

This supplementary research document details the empirical benchmark evaluation, physical signal extraction methodologies, and game-theoretic explainability findings supporting our Explainable Digital Twin Framework. We evaluate our predictive pipeline on two complementary sources:
1. **The UCI AI4I 2020 Predictive Maintenance Dataset** (10,000 empirical milling machine instances) for reproducible machine failure classification and TreeSHAP explainability.
2. **Physics-Guided 10 kHz Induction Motor Telemetry** (1-second, 10,000-sample windows at 415V, 50 Hz, 3 kW under 25%, 50%, 75%, and 100% load) for spectral motor current signature analysis (MCSA), vibration ball-pass decomposition, and PyTorch LSTM remaining useful life (RUL) regression.

---

## 2. Benchmark Dataset Description & Provenance

### 2.1 Official Attribution & Metadata
* **Dataset Name:** UCI AI4I 2020 Predictive Maintenance Dataset
* **Source Repository:** UCI Machine Learning Repository
* **URL:** [https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset](https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset)
* **Citation:** Mathes, S. (2020). *AI4I 2020 Predictive Maintenance Dataset*. UCI Machine Learning Repository.
* **License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
* **Instance Count:** 10,000 industrial records
* **Input Features:** 14 original columns, preprocessed into 9 domain-engineered features
* **Target Variable:** Binary `Machine failure` (0 = Healthy, 1 = Failure)

### 2.2 Class Distribution & Imbalance
The dataset exhibits extreme class imbalance representative of modern industrial plants where failures are rare:
* **Healthy Instances ($y = 0$):** 9,661 (96.61%)
* **Failure Instances ($y = 1$):** 339 (3.39%)
* **Imbalance Ratio:** $28.5 : 1$

Specific failure modes recorded in the dataset:
* **Tool Wear Failure (TWF):** 46 instances
* **Heat Dissipation Failure (HDF):** 115 instances
* **Power Failure (PWF):** 95 instances
* **Overstrain Failure (OSF):** 98 instances
* **Random Failure (RNF):** 19 instances

---

## 3. Physical Feature Engineering & Preprocessing

To ensure statistical features align with thermal, kinetic, and stress limits, three composite physical features were derived:

1. **Convective Temperature Gradient ($\Delta T$ in Kelvin):**
   $$\Delta T = T_{\text{process}} - T_{\text{air}}$$
   *Physical Rationale:* A low $\Delta T$ under high rotational speed indicates insufficient heat dissipation, triggering Heat Dissipation Failure (HDF).

2. **Mechanical Shaft Power ($P_{\text{mech}}$ in Watts):**
   $$P_{\text{mech}} = \tau \cdot \omega = \tau \cdot \left(\frac{2\pi \cdot N}{60}\right)$$
   where $\tau$ is torque (Nm) and $N$ is rotational speed (RPM).
   *Physical Rationale:* Powers outside the rated band ($<3,500\text{ W}$ or $>9,000\text{ W}$) indicate drive supply excursions, triggering Power Failure (PWF).

3. **Mechanical Overstrain Metric ($M_{\text{strain}}$ in $\text{min} \cdot \text{Nm}$):**
   $$M_{\text{strain}} = t_{\text{tool wear}} \cdot \tau$$
   *Physical Rationale:* Simultaneous high torque and extended tool wear cause sudden tool breakage, triggering Overstrain Failure (OSF).

4. **Product Quality Variant Encoding:**
   $$\text{Type} \in \{L, M, H\} \longrightarrow \text{Type\_Code} \in \{0, 1, 2\}$$

---

## 4. Experimental Setup & Leakage Prevention Protocol

* **Partition Strategy:** Stratified 80/20 train/test split.
  * Training Partition: 8,000 instances (271 failure, 7,729 healthy)
  * Unseen Hold-out Test Partition: 2,000 instances (68 failure, 1,932 healthy)
* **Cross-Validation:** 5-Fold Stratified Cross-Validation on the training partition ($K=5$).
* **Class Weighting:** Cost-sensitive positive class weighting ($\frac{N_{\text{healthy}}}{N_{\text{failure}}} \approx 28.5$) applied to tree splits to penalize missed critical failures.
* **Deterministic Seeds:** Random state fixed to $42$ across all partitioning and estimators.

---

## 5. Measured Model Comparisons & Benchmark Results

Four architectures were trained, tuned, and evaluated on the identical unseen 2,000-sample test set:
1. **Baseline 1:** Balanced Logistic Regression (Linear baseline with standard scaling)
2. **Baseline 2:** Decision Tree Classifier (Max depth 6, balanced class weights)
3. **Candidate 1:** Random Forest (100 estimators, max depth 8)
4. **Candidate 2 (Champion):** Gradient Boosted Trees (XGBoost 3.x, 120 estimators, learning rate 0.08, max depth 5)

### Table 1: Empirical Evaluation on Unseen Test Set (2,000 Instances)

| Model Architecture | Test Accuracy | Precision | Recall | F1-Score | ROC-AUC | 5-Fold CV F1 (Mean ± Std) | 5-Fold CV ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | 85.75% | 17.80% | **88.24%** | 0.2963 | 0.9393 | 0.2719 ± 0.0126 | 0.9235 |
| **Decision Tree** | 95.00% | 38.89% | 82.35% | 0.5283 | 0.8568 | 0.5530 ± 0.0153 | 0.9168 |
| **Random Forest** | 98.40% | **74.32%** | 80.88% | 0.7746 | **0.9831** | **0.8246 ± 0.0374** | 0.9797 |
| **XGBoost (Champion)** | **98.45%** | 74.03% | 83.82% | **0.7862** | 0.9808 | 0.7775 ± 0.0245 | **0.9795** |

### Table 2: Confusion Matrix for Champion XGBoost (Test Partition: $N = 2,000$)

| Actual \ Predicted | Predicted Normal ($y=0$) | Predicted Failure ($y=1$) | Total |
| :--- | :---: | :---: | :---: |
| **Actual Normal ($y=0$)** | **1,912** (True Negative) | **20** (False Positive) | 1,932 |
| **Actual Failure ($y=1$)** | **11** (False Negative) | **57** (True Positive) | 68 |
| **Total** | 1,923 | 77 | 2,000 |

* **True Negative Rate (Specificity):** $\frac{1912}{1932} = 98.96\%$
* **True Positive Rate (Recall / Sensitivity):** $\frac{57}{68} = 83.82\%$
* **False Alarm Rate (Fall-out):** $\frac{20}{1932} = 1.04\%$

---

## 6. TreeSHAP Explainability Findings

Using Lundberg's TreeSHAP algorithm, game-theoretic feature contributions were computed on the test partition.

### Table 3: Global Feature Importance Ranking (Mean Absolute SHAP)

| Rank | Feature Variable | Physical Domain | Mean Absolute SHAP $E[|\phi_i|]$ | Primary Sensitive Failure Mode |
| :---: | :--- | :--- | :---: | :--- |
| **1** | `Rotational_speed_rpm` | Kinematic / Drive Dynamics | **1.3314** | Power Failure (PWF), Heat Dissipation (HDF) |
| **2** | `Tool_wear_min` | Cumulative Degradation | **1.2755** | Tool Wear Failure (TWF), Overstrain (OSF) |
| **3** | `Mechanical_Power_W` | Electromagnetic Transfer | **1.2263** | Power Failure (PWF) |
| **4** | `Overstrain_Metric` | Structural Stress | **0.5984** | Overstrain Failure (OSF) |
| **5** | `Temp_difference_K` | Thermal Dissipation | **0.5015** | Heat Dissipation Failure (HDF) |
| **6** | `Torque_Nm` | Shaft Load | **0.4996** | Overstrain (OSF), Power (PWF) |
| **7** | `Process_temperature_K` | Operational Environment | **0.2971** | Heat Dissipation Failure (HDF) |
| **8** | `Air_temperature_K` | Ambient Baseline | **0.2453** | Convective Cooling Efficiency |
| **9** | `Type_Code` | Machine Grade Variant | **0.0646** | Invariant Quality Baseline |

### 6.1 Local Instance Attribution Mechanics
For any prediction $x$, TreeSHAP guarantees exact additive local efficiency:
$$f(x) = \phi_0 + \sum_{i=1}^M \phi_i(x)$$
* Features where $\phi_i > 0$ elevate the model's log-odds toward machine failure.
* Features where $\phi_i < 0$ act as stabilizing evidence confirming normal baseline operation.

---

## 7. Induction Motor Digital Twin: Stage 1 to Stage 3 Pipeline

In parallel with the AI4I benchmark, our framework implements high-resolution spectral and sequence models for three-phase induction machinery:

* **Stage 1 (Unsupervised Anomaly Detection):** Isolation Forest trained on healthy baseline operating windows (Contamination: 0.05). Output: Normalized anomaly score $\in [0, 1]$.
* **Stage 2 (Multiclass Fault Classification):** XGBoost classifier trained on 1,248 simulation runs across 5 target fault states:
  1. Healthy Operation
  2. Broken Rotor Bar ($f_{\text{br}} = f_s(1 \pm 2s) \approx 46\text{ Hz}, 54\text{ Hz}$)
  3. Stator Inter-turn Short Circuit (3rd harmonic 150 Hz distortion + thermal rise)
  4. Bearing Race Defect (BPFO $\approx 80.5\text{ Hz}$ impacts + kurtosis $> 3.5$)
  5. Air-gap Eccentricity (1x shaft rotational vibration at $24.0\text{ Hz}$)
  *Test Accuracy:* **94.55%**, Multiclass LogLoss: 0.176.
* **Stage 3 (Remaining Useful Life Regression):** 2-layer PyTorch LSTM sequence regressor evaluating 5-window rolling degradation trajectories:
  * Mean Absolute Error (MAE): **0.22 hours**
  * Root Mean Square Error (RMSE): **0.29 hours**

---

## 8. Threats to Validity & Engineering Limitations

1. **Synthetic Nature of AI4I Benchmark:** The AI4I 2020 dataset was generated via numerical simulation models rather than physical factory telemetry. Therefore, reported precision and recall reflect agreement with the simulated mechanics and require hardware test-bench calibration before deployment on life-critical factory lines.
2. **Correlation vs. Causation:** SHAP attributions represent model split sensitivity, not direct physical causal mechanisms. Reducing a variable with high SHAP attribution will lower the model's predicted risk, but physical repair must address the actual root cause (e.g. replacing a worn tool insert or cleaning clogged cooling fins).
3. **Dynamic Operational Speed Variations:** Fixed-sampling windowing assumes quasi-stationary speed during the 1-second analysis interval. Rapid dynamic acceleration/deceleration requires order tracking or angle-domain resampling.

---

## 9. Reproducibility & Software Artifacts

All artifacts, code, model weights, and datasets are organized in the project repository:
* **Trained AI4I Model:** [`ml/artifacts/ai4i/ai4i_champion_model.joblib`](file:///C:/Users/aryan/.gemini/antigravity/scratch/explainable-digital-twin/ml/artifacts/ai4i/ai4i_champion_model.joblib)
* **Dataset File:** [`data/ai4i2020/ai4i2020.csv`](file:///C:/Users/aryan/.gemini/antigravity/scratch/explainable-digital-twin/data/ai4i2020/ai4i2020.csv)
* **Evaluation JSON:** [`ml/artifacts/ai4i/ai4i_evaluation_metrics.json`](file:///C:/Users/aryan/.gemini/antigravity/scratch/explainable-digital-twin/ml/artifacts/ai4i/ai4i_evaluation_metrics.json)
* **Interactive Test Cases:** [`ml/artifacts/ai4i/ai4i_test_cases.json`](file:///C:/Users/aryan/.gemini/antigravity/scratch/explainable-digital-twin/ml/artifacts/ai4i/ai4i_test_cases.json)
* **Training Pipeline Script:** [`ml/training/train_ai4i_models.py`](file:///C:/Users/aryan/.gemini/antigravity/scratch/explainable-digital-twin/ml/training/train_ai4i_models.py)
* **Full Stack Verification:** `pytest tests/ -v` (16/16 passed), `npm run build` (2,434 modules transformed).
