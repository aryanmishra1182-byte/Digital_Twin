"""
MACHINA-X Comprehensive Model Quality & Scientific Verification Suite
=====================================================================
Executes rigorous academic checks specified in Part 1B:
1. Probability Calibration (ECE & Reliability Diagram on held-out test split)
2. Unknown Fault Detection (UNCLASSIFIED path evaluated on dataset_combined_faults.csv)
3. Unseen Severities Generalization (Trained on 0.05, 0.2, 0.7, 0.95; tested on 0.40)
4. Noise Robustness (Accuracy vs SNR curve from 30 dB down to 5 dB)
5. Sensor Modality Ablation (Current vs Vibration vs Temp vs Combined)
6. Statistical Significance (95% Bootstrap CIs & McNemar's tests)
7. Measurable Explanations (Physics consistency score & fidelity deletion)

ZERO hardcoded metrics. All values computed directly from saved datasets and models.
Saves verified metrics to ml/artifacts/model_quality_checks.json.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix, f1_score
from sklearn.calibration import CalibratedClassifierCV
import xgboost as xgb
import joblib

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from ml.features.feature_extractor import FEATURE_NAMES
from simulator.motor_simulator import FAULT_CLASSES

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "ml", "artifacts")

def compute_ece(probs, labels, n_bins=10):
    """Compute Expected Calibration Error (ECE) and reliability curve."""
    confidences = np.max(probs, axis=1)
    predictions = np.argmax(probs, axis=1)
    accuracies = (predictions == labels).astype(float)

    bins = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    curve = []

    for i in range(n_bins):
        in_bin = (confidences > bins[i]) & (confidences <= bins[i + 1])
        prop_in_bin = np.mean(in_bin)
        if prop_in_bin > 0:
            bin_acc = np.mean(accuracies[in_bin])
            bin_conf = np.mean(confidences[in_bin])
            ece += np.abs(bin_acc - bin_conf) * prop_in_bin
            curve.append({
                "bin_lower": round(float(bins[i]), 2),
                "bin_upper": round(float(bins[i + 1]), 2),
                "samples_count": int(np.sum(in_bin)),
                "confidence": round(float(bin_conf), 4),
                "accuracy": round(float(bin_acc), 4)
            })

    return round(float(ece), 4), curve

def run_calibration_check(clf, X_val, y_val, X_test, y_test):
    print("  [1/7] Calibrating Stage 2 probabilities (Platt Scaling & ECE)...")
    raw_probs = clf.predict_proba(X_test)
    raw_ece, raw_curve = compute_ece(raw_probs, y_test)

    # Calibrate with Platt scaling (sigmoid) on validation set
    calibrator = CalibratedClassifierCV(clf, cv="prefit", method="sigmoid")
    calibrator.fit(X_val, y_val)
    cal_probs = calibrator.predict_proba(X_test)
    cal_ece, cal_curve = compute_ece(cal_probs, y_test)

    return {
        "raw_ece": raw_ece,
        "calibrated_ece": cal_ece,
        "ece_reduction_pct": round(float((raw_ece - cal_ece) / (raw_ece + 1e-6) * 100), 2),
        "raw_reliability_curve": raw_curve,
        "calibrated_reliability_curve": cal_curve
    }

def run_unknown_faults_check(clf, X_val, y_val, scaler):
    print("  [2/7] Evaluating UNCLASSIFIED path on compound failure dataset...")
    # Find validation threshold for unknown rejection (5th percentile of max prob on correct validation predictions)
    val_probs = clf.predict_proba(X_val)
    val_preds = np.argmax(val_probs, axis=1)
    correct_mask = (val_preds == y_val)
    val_confs = np.max(val_probs[correct_mask], axis=1)
    rejection_threshold = round(float(np.percentile(val_confs, 5)), 4)

    # Load real generated compound fault dataset
    comb_path = os.path.join(BASE_DIR, "data", "processed", "dataset_combined_faults.csv")
    if not os.path.exists(comb_path):
        raise FileNotFoundError(f"Missing compound fault dataset: {comb_path}")

    comb_df = pd.read_csv(comb_path)
    X_comb_raw = comb_df[FEATURE_NAMES].values
    X_comb_scaled = scaler.transform(X_comb_raw)
    comb_probs = clf.predict_proba(X_comb_scaled)
    max_probs = np.max(comb_probs, axis=1)

    unclassified_count = int(np.sum(max_probs < rejection_threshold))

    return {
        "rejection_threshold": rejection_threshold,
        "combined_fault_samples": len(X_comb_raw),
        "unclassified_or_uncertain_samples": unclassified_count,
        "unclassified_rate": round(float(unclassified_count / len(X_comb_raw)), 4),
        "mean_confidence_on_combined": round(float(np.mean(max_probs)), 4)
    }

def run_unseen_severities_check(df_full):
    print("  [3/7] Testing generalization on unseen severity (0.40)...")
    # Train on severities 0.05, 0.20, 0.70, 0.95 (and healthy 0.0); test on held out 0.40
    train_subset = df_full[(df_full["severity"].isin([0.0, 0.05, 0.20, 0.70, 0.95])) & (df_full["split"].isin(["train", "val"]))]
    test_subset = df_full[(df_full["severity"] == 0.40)]

    X_tr = train_subset[FEATURE_NAMES].values
    y_tr = train_subset["fault_label"].values
    X_te = test_subset[FEATURE_NAMES].values
    y_te = test_subset["fault_label"].values

    clf_sev = xgb.XGBClassifier(n_estimators=120, learning_rate=0.08, max_depth=5, subsample=0.85, random_state=42)
    clf_sev.fit(X_tr, y_tr)
    preds = clf_sev.predict(X_te)

    acc = float(accuracy_score(y_te, preds))
    macro_f1 = float(f1_score(y_te, preds, average="macro", zero_division=0))

    return {
        "held_out_severity": 0.40,
        "training_severities": [0.0, 0.05, 0.20, 0.70, 0.95],
        "test_windows": len(test_subset),
        "accuracy_on_unseen_severity": round(acc, 4),
        "macro_f1_on_unseen_severity": round(macro_f1, 4)
    }

def run_noise_robustness_check(clf, X_test, y_test):
    print("  [4/7] Evaluating noise robustness across SNR curve (30 dB -> 5 dB)...")
    snr_levels_db = [30, 25, 20, 15, 10, 5]
    curve = []

    sig_power = np.mean(X_test ** 2, axis=0)

    for snr in snr_levels_db:
        snr_linear = 10 ** (snr / 10.0)
        noise_variance = sig_power / snr_linear
        noise = np.random.RandomState(42).normal(0, np.sqrt(noise_variance), X_test.shape)
        X_noisy = X_test + noise

        preds = clf.predict(X_noisy)
        acc = float(accuracy_score(y_test, preds))
        macro_f1 = float(f1_score(y_test, preds, average="macro", zero_division=0))

        curve.append({
            "snr_db": snr,
            "accuracy": round(acc, 4),
            "macro_f1": round(macro_f1, 4)
        })

    return curve

def run_feature_ablation_study(X_train, y_train, X_test, y_test):
    print("  [5/7] Executing feature modality ablation (Current vs Vibration vs Temp)...")
    cur_feats = [f for f in FEATURE_NAMES if f.startswith("current_") or f.startswith("brb_") or f.startswith("eccentricity_")]
    vib_feats = [f for f in FEATURE_NAMES if f.startswith("vib_")]
    temp_feats = [f for f in FEATURE_NAMES if f.startswith("temp_")]

    modalities = {
        "Current_Only": cur_feats,
        "Vibration_Only": vib_feats,
        "Temperature_Only": temp_feats,
        "Current_and_Vibration": cur_feats + vib_feats,
        "All_Three_Sensors_Full_Model": FEATURE_NAMES
    }

    ablation_results = {}
    for name, f_list in modalities.items():
        indices = [FEATURE_NAMES.index(f) for f in f_list]
        X_tr_sub = X_train[:, indices]
        X_te_sub = X_test[:, indices]

        m = xgb.XGBClassifier(n_estimators=120, learning_rate=0.08, max_depth=5, subsample=0.85, random_state=42)
        m.fit(X_tr_sub, y_train)
        preds = m.predict(X_te_sub)

        acc = float(accuracy_score(y_test, preds))
        macro_f1 = float(f1_score(y_test, preds, average="macro", zero_division=0))

        ablation_results[name] = {
            "feature_count": len(f_list),
            "accuracy": round(acc, 4),
            "macro_f1": round(macro_f1, 4)
        }

    return ablation_results

def run_statistical_significance(clf, X_train, y_train, X_test, y_test):
    print("  [6/7] Computing 95% Bootstrap Confidence Intervals & McNemar's tests...")
    n_bootstraps = 1000
    rng = np.random.RandomState(42)
    boot_accs = []
    boot_f1s = []

    y_pred_xgb = clf.predict(X_test)

    for _ in range(n_bootstraps):
        boot_idx = rng.choice(len(y_test), size=len(y_test), replace=True)
        y_t_b = y_test[boot_idx]
        y_p_b = y_pred_xgb[boot_idx]
        boot_accs.append(accuracy_score(y_t_b, y_p_b))
        boot_f1s.append(f1_score(y_t_b, y_p_b, average="macro", zero_division=0))

    ci_acc = [round(float(np.percentile(boot_accs, 2.5)), 4), round(float(np.percentile(boot_accs, 97.5)), 4)]
    ci_f1 = [round(float(np.percentile(boot_f1s, 2.5)), 4), round(float(np.percentile(boot_f1s, 97.5)), 4)]

    # McNemar's test vs Random Forest and SVM
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.svm import SVC

    rf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)

    svm = SVC(C=10.0, kernel="rbf", probability=True, random_state=42)
    svm.fit(X_train, y_train)
    y_pred_svm = svm.predict(X_test)

    def mcnemar(y_true, y_pred1, y_pred2):
        corr1 = (y_pred1 == y_true)
        corr2 = (y_pred2 == y_true)
        b = int(np.sum(corr1 & (~corr2)))
        c = int(np.sum((~corr1) & corr2))
        stat = float((abs(b - c) - 1)**2 / (b + c + 1e-6))
        p_val = float(stats.chi2.sf(stat, df=1))
        return {"b_xgb_correct_baseline_wrong": b, "c_xgb_wrong_baseline_correct": c, "chi2": round(stat, 4), "p_value": round(p_val, 5)}

    mcnemar_rf = mcnemar(y_test, y_pred_xgb, y_pred_rf)
    mcnemar_svm = mcnemar(y_test, y_pred_xgb, y_pred_svm)

    return {
        "bootstrap_samples": n_bootstraps,
        "accuracy_95_ci": ci_acc,
        "macro_f1_95_ci": ci_f1,
        "mcnemar_vs_random_forest": mcnemar_rf,
        "mcnemar_vs_svm": mcnemar_svm
    }

def run_measurable_explanations_check(clf, X_test, y_test, scaler):
    print("  [7/7] Measuring explanation consistency & deletion fidelity...")
    from ml.explainability.shap_explainer import MotorShapExplainer
    clf_path = os.path.join(ARTIFACTS_DIR, "fault_classifier.joblib")
    explainer = MotorShapExplainer(clf_path)

    expected_physics_groups = {
        "BROKEN_ROTOR_BAR": ["brb_sideband_ratio", "brb_left_sideband_amp", "brb_right_sideband_amp", "current_thd"],
        "STATOR_INTER_TURN_SHORT": ["current_harm_5_ratio", "current_harm_3_ratio", "current_thd", "temp_rate_of_rise"],
        "BEARING_DEFECT": ["vib_bpfo_energy", "vib_bpfi_energy", "vib_kurtosis", "vib_crest_factor", "vib_peak_to_peak"],
        "AIR_GAP_ECCENTRICITY": ["eccentricity_sideband_amp", "vib_1x_shaft_amp", "vib_rms"]
    }

    consistent_count = 0
    total_fault_samples = 0

    # Evaluate on a representative sample of test windows for speed (e.g. 200 windows)
    sample_indices = np.linspace(0, len(X_test) - 1, min(200, len(X_test)), dtype=int)

    for i in sample_indices:
        c_idx = y_test[i]
        c_name = FAULT_CLASSES[c_idx]
        if c_name == "HEALTHY":
            continue
        total_fault_samples += 1
        x_vec = X_test[i]
        exp = explainer.explain_prediction(x_vec, top_k=3)
        top_features = [item["feature_name"] for item in exp.get("top_attributions", [])]

        expected_group = expected_physics_groups.get(c_name, [])
        if any(f in expected_group for f in top_features):
            consistent_count += 1

    physics_consistency_score = round(float(consistent_count / (total_fault_samples + 1e-6)), 4)

    # Fidelity Deletion Test: Mask top 2 SHAP features vs Mask 2 random features
    baseline_acc = float(accuracy_score(y_test[sample_indices], clf.predict(scaler.transform(X_test[sample_indices]))))
    masked_top_accs = []
    masked_rand_accs = []

    for i in sample_indices:
        x_vec = X_test[i].copy()
        exp = explainer.explain_prediction(x_vec, top_k=2)
        top_f_indices = [FEATURE_NAMES.index(item["feature_name"]) for item in exp.get("top_attributions", [])[:2]]

        x_top_masked = x_vec.copy()
        x_top_masked[top_f_indices] = 0.0

        rand_indices = np.random.RandomState(i).choice(len(FEATURE_NAMES), size=2, replace=False)
        x_rand_masked = x_vec.copy()
        x_rand_masked[rand_indices] = 0.0

        pred_top = clf.predict(scaler.transform(x_top_masked.reshape(1, -1)))[0]
        pred_rand = clf.predict(scaler.transform(x_rand_masked.reshape(1, -1)))[0]

        masked_top_accs.append(pred_top == y_test[i])
        masked_rand_accs.append(pred_rand == y_test[i])

    fidelity_deletion_top2_drop = round(float(baseline_acc - np.mean(masked_top_accs)), 4)
    fidelity_deletion_rand2_drop = round(float(baseline_acc - np.mean(masked_rand_accs)), 4)

    return {
        "physics_consistency_score": physics_consistency_score,
        "fault_test_windows_evaluated": total_fault_samples,
        "baseline_accuracy": round(baseline_acc, 4),
        "fidelity_top2_deletion_accuracy_drop": fidelity_deletion_top2_drop,
        "fidelity_random2_deletion_accuracy_drop": fidelity_deletion_rand2_drop,
        "fidelity_ratio_shap_vs_random": round(float(fidelity_deletion_top2_drop / (fidelity_deletion_rand2_drop + 1e-6)), 2)
    }

def main():
    print("=== MACHINA-X Full Model Quality Verification Pipeline ===")
    train_df = pd.read_csv(os.path.join(BASE_DIR, "data", "processed", "dataset_train.csv"))
    val_df = pd.read_csv(os.path.join(BASE_DIR, "data", "processed", "dataset_val.csv"))
    test_df = pd.read_csv(os.path.join(BASE_DIR, "data", "processed", "dataset_test.csv"))
    full_df = pd.read_csv(os.path.join(BASE_DIR, "data", "processed", "dataset_full.csv"))

    X_train = train_df[FEATURE_NAMES].values
    y_train = train_df["fault_label"].values
    X_val = val_df[FEATURE_NAMES].values
    y_val = val_df["fault_label"].values
    X_test = test_df[FEATURE_NAMES].values
    y_test = test_df["fault_label"].values

    clf_path = os.path.join(ARTIFACTS_DIR, "fault_classifier.joblib")
    clf_bundle = joblib.load(clf_path)
    clf = clf_bundle["model"]
    scaler = clf_bundle["scaler"]

    X_train_s = scaler.transform(X_train)
    X_val_s = scaler.transform(X_val)
    X_test_s = scaler.transform(X_test)

    calib = run_calibration_check(clf, X_val_s, y_val, X_test_s, y_test)
    unknown = run_unknown_faults_check(clf, X_val_s, y_val, scaler)
    unseen_sev = run_unseen_severities_check(full_df)
    noise = run_noise_robustness_check(clf, X_test_s, y_test)
    ablation = run_feature_ablation_study(X_train, y_train, X_test, y_test)
    stats_ci = run_statistical_significance(clf, X_train_s, y_train, X_test_s, y_test)
    explain_meas = run_measurable_explanations_check(clf, X_test, y_test, scaler)

    output = {
        "provenance": "Synthetic Simulation (IEEE Paper Spec 3kW 415V Motor)",
        "probability_calibration": calib,
        "unknown_fault_handling": unknown,
        "unseen_severity_generalization": unseen_sev,
        "noise_robustness_snr_curve": noise,
        "feature_modality_ablation": ablation,
        "statistical_significance_and_confidence_intervals": stats_ci,
        "measurable_explainability": explain_meas
    }

    out_file = os.path.join(ARTIFACTS_DIR, "model_quality_checks.json")
    with open(out_file, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\n[SUCCESS] Model quality checks completed. Saved to {out_file}")

if __name__ == "__main__":
    main()
