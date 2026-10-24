"""
Robustness and Generalization Evaluation Script
==============================================
Implements evaluation promised in the research specification:
1. Multi-seed Evaluation:
   - 5 independent seeds: [42, 101, 2024, 7, 999]
   - Evaluates Stage 1 (Isolation Forest) and Stage 2 (XGBoost) across seeds
   - Reports mean and standard deviation of accuracy, macro F1, precision, recall
2. Leave-One-Load-Out (LOLO) Generalization:
   - 4 motor load regimes: 25%, 50%, 75%, 100% rated load
   - For each load L: trains on remaining 3 loads, tests on held-out load L
   - Reports per-load accuracy, macro F1, and per-class performance

Saves complete results to ml/artifacts/robustness_metrics.json.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, f1_score
from sklearn.ensemble import IsolationForest
import xgboost as xgb
from sklearn.preprocessing import StandardScaler

# Ensure root path is accessible
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.features.feature_extractor import FEATURE_NAMES
from ml.datasets.dataset_generator import generate_full_dataset
from simulator.motor_simulator import FAULT_CLASSES

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "ml", "artifacts")

SEEDS = [42, 101, 2024, 7, 999]
LOADS = [25.0, 50.0, 75.0, 100.0]

def run_multi_seed_evaluation():
    print("\n--- [PART 1/2] 5-Seed Robustness Evaluation ---")
    seed_results = []

    for idx, seed in enumerate(SEEDS, 1):
        print(f"  Running seed {idx}/{len(SEEDS)} (seed={seed})...")
        # Generate partitioned dataset with this seed into memory / temp
        temp_dir = os.path.join(BASE_DIR, "data", f"temp_seed_{seed}")
        df, meta = generate_full_dataset(
            output_dir=temp_dir,
            runs_per_condition=4,
            windows_per_run=6,
            loads=LOADS,
            seed=seed
        )

        train_df = df[df["split"] == "train"]
        test_df = df[df["split"] == "test"]

        X_train = train_df[FEATURE_NAMES].values
        y_train = train_df["fault_label"].values
        X_test = test_df[FEATURE_NAMES].values
        y_test = test_df["fault_label"].values

        # 1. Stage 1: Isolation Forest
        # Contamination = 0.05 on healthy or full data
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        iso = IsolationForest(n_estimators=150, contamination=0.05, random_state=seed)
        iso.fit(X_train_scaled)
        # Predictions: 1 = inlier (healthy), -1 = outlier (faulty)
        # Ground truth: y == 0 is healthy, y > 0 is anomaly
        iso_preds = iso.predict(X_test_scaled)
        pred_is_anomaly = (iso_preds == -1).astype(int)
        true_is_anomaly = (y_test > 0).astype(int)

        iso_p, iso_r, iso_f1, _ = precision_recall_fscore_support(true_is_anomaly, pred_is_anomaly, average="binary", zero_division=0)

        # 2. Stage 2: XGBoost Classifier
        clf = xgb.XGBClassifier(
            n_estimators=120,
            learning_rate=0.08,
            max_depth=5,
            subsample=0.85,
            objective="multi:softprob",
            eval_metric="mlogloss",
            random_state=seed
        )
        clf.fit(X_train, y_train)
        y_pred = clf.predict(X_test)

        acc = float(accuracy_score(y_test, y_pred))
        macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(y_test, y_pred, average="macro", zero_division=0)
        
        # Clean up temp files
        for f in os.listdir(temp_dir):
            try:
                os.remove(os.path.join(temp_dir, f))
            except Exception:
                pass
        try:
            os.rmdir(temp_dir)
        except Exception:
            pass

        seed_results.append({
            "seed": seed,
            "stage_1_anomaly": {
                "precision": round(float(iso_p), 4),
                "recall": round(float(iso_r), 4),
                "f1_score": round(float(iso_f1), 4)
            },
            "stage_2_classifier": {
                "accuracy": round(float(acc), 4),
                "macro_precision": round(float(macro_p), 4),
                "macro_recall": round(float(macro_r), 4),
                "macro_f1": round(float(macro_f1), 4)
            }
        })

    # Summary statistics
    clf_accs = [r["stage_2_classifier"]["accuracy"] for r in seed_results]
    clf_f1s = [r["stage_2_classifier"]["macro_f1"] for r in seed_results]
    anom_f1s = [r["stage_1_anomaly"]["f1_score"] for r in seed_results]

    multi_seed_summary = {
        "seeds_evaluated": SEEDS,
        "runs": seed_results,
        "summary": {
            "stage_2_accuracy_mean": round(float(np.mean(clf_accs)), 4),
            "stage_2_accuracy_std": round(float(np.std(clf_accs)), 4),
            "stage_2_macro_f1_mean": round(float(np.mean(clf_f1s)), 4),
            "stage_2_macro_f1_std": round(float(np.std(clf_f1s)), 4),
            "stage_1_anomaly_f1_mean": round(float(np.mean(anom_f1s)), 4),
            "stage_1_anomaly_f1_std": round(float(np.std(anom_f1s)), 4)
        }
    }
    print(f"  Multi-seed Classifier Accuracy: {multi_seed_summary['summary']['stage_2_accuracy_mean']:.4f} ± {multi_seed_summary['summary']['stage_2_accuracy_std']:.4f}")
    print(f"  Multi-seed Classifier Macro F1: {multi_seed_summary['summary']['stage_2_macro_f1_mean']:.4f} ± {multi_seed_summary['summary']['stage_2_macro_f1_std']:.4f}")
    print(f"  Multi-seed Anomaly F1:         {multi_seed_summary['summary']['stage_1_anomaly_f1_mean']:.4f} ± {multi_seed_summary['summary']['stage_1_anomaly_f1_std']:.4f}")
    return multi_seed_summary

def run_leave_one_load_out_evaluation():
    print("\n--- [PART 2/2] Leave-One-Load-Out (LOLO) Generalization ---")
    full_dataset_path = os.path.join(BASE_DIR, "data", "processed", "dataset_full.csv")
    if not os.path.exists(full_dataset_path):
        raise FileNotFoundError(f"Missing {full_dataset_path}")

    df = pd.read_csv(full_dataset_path)
    lolo_results = {}

    for held_out_load in LOADS:
        print(f"  Testing with Held-out Load = {int(held_out_load)}% (Training on other 3 loads)...")
        train_df = df[df["load_pct"] != held_out_load]
        test_df = df[df["load_pct"] == held_out_load]

        X_train = train_df[FEATURE_NAMES].values
        y_train = train_df["fault_label"].values
        X_test = test_df[FEATURE_NAMES].values
        y_test = test_df["fault_label"].values

        clf = xgb.XGBClassifier(
            n_estimators=120,
            learning_rate=0.08,
            max_depth=5,
            subsample=0.85,
            objective="multi:softprob",
            eval_metric="mlogloss",
            random_state=42
        )
        clf.fit(X_train, y_train)
        y_pred = clf.predict(X_test)

        acc = float(accuracy_score(y_test, y_pred))
        macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(y_test, y_pred, average="macro", zero_division=0)
        
        # Per class F1
        per_class = {}
        for c_idx, c_name in enumerate(FAULT_CLASSES):
            c_true = (y_test == c_idx)
            c_pred = (y_pred == c_idx)
            p, r, f, _ = precision_recall_fscore_support(c_true, c_pred, average="binary", zero_division=0)
            per_class[c_name] = {
                "precision": round(float(p), 4),
                "recall": round(float(r), 4),
                "f1": round(float(f), 4),
                "support": int(c_true.sum())
            }

        lolo_results[f"load_{int(held_out_load)}pct"] = {
            "held_out_load_pct": held_out_load,
            "train_samples": len(train_df),
            "test_samples": len(test_df),
            "accuracy": round(acc, 4),
            "macro_precision": round(float(macro_p), 4),
            "macro_recall": round(float(macro_r), 4),
            "macro_f1": round(float(macro_f1), 4),
            "per_class": per_class
        }
        print(f"    Load {int(held_out_load)}%: Accuracy = {acc*100:.2f}%, Macro F1 = {macro_f1:.4f}")

    mean_lolo_acc = np.mean([v["accuracy"] for v in lolo_results.values()])
    mean_lolo_f1 = np.mean([v["macro_f1"] for v in lolo_results.values()])

    lolo_summary = {
        "per_load": lolo_results,
        "mean_accuracy_across_loads": round(float(mean_lolo_acc), 4),
        "mean_macro_f1_across_loads": round(float(mean_lolo_f1), 4)
    }
    print(f"  Mean Cross-Load Generalization Accuracy: {mean_lolo_acc*100:.2f}%, Macro F1: {mean_lolo_f1:.4f}")
    return lolo_summary

def main():
    multi_seed = run_multi_seed_evaluation()
    lolo = run_leave_one_load_out_evaluation()

    full_report = {
        "provenance": "Synthetic Simulation (IEEE Paper Spec 3kW 415V Motor)",
        "multi_seed_evaluation": multi_seed,
        "leave_one_load_out_evaluation": lolo
    }

    out_file = os.path.join(ARTIFACTS_DIR, "robustness_metrics.json")
    with open(out_file, "w") as f:
        json.dump(full_report, f, indent=2)

    print(f"\n[SUCCESS] Robustness evaluation complete. Saved to {out_file}")

if __name__ == "__main__":
    main()
