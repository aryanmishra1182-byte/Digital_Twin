"""
Generate Stage 1 Diagnostic Score Distributions (ml/artifacts/stage1_diagnosis.json)
===================================================================================
Analyzes the trained Isolation Forest anomaly detector on the held-out test split,
computing exact score distributions and detection rates broken down by:
- Fault Type
- Severity Level (incipient to severe)
- Operating Load (25%, 50%, 75%, 100%)
- Speed / Slip variations
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from ml.features.feature_extractor import FEATURE_NAMES

def generate_stage1_diagnosis(
    data_dir: str = "data/processed",
    artifacts_dir: str = "ml/artifacts"
):
    # 1. Load artifacts
    bundle_path = os.path.join(artifacts_dir, "anomaly_detector.joblib")
    metrics_path = os.path.join(artifacts_dir, "anomaly_detector_metrics.json")
    test_csv = os.path.join(data_dir, "dataset_test.csv")

    if not os.path.exists(bundle_path):
        raise FileNotFoundError("Missing stage 1 model bundle: anomaly_detector.joblib")

    bundle = joblib.load(bundle_path)
    if isinstance(bundle, dict):
        iso_forest = bundle["model"]
        scaler = bundle["scaler"]
        threshold = bundle.get("threshold", 0.0)
    else:
        iso_forest = bundle
        scaler = None
        threshold = 0.0

    if os.path.exists(metrics_path):
        with open(metrics_path, "r", encoding="utf-8") as f:
            meta_metrics = json.load(f)
        threshold = meta_metrics.get("threshold", threshold)

    # 2. Load test data
    test_df = pd.read_csv(test_csv)
    X = test_df[FEATURE_NAMES].values
    X_scaled = scaler.transform(X) if scaler is not None else X

    # Compute raw decision function and anomaly scores (higher = more anomalous)
    raw_df = iso_forest.decision_function(X_scaled)
    scores = -raw_df
    preds = (scores > threshold).astype(int)

    test_df["anomaly_score"] = scores
    test_df["is_anomalous_pred"] = preds
    test_df["is_anomalous_true"] = (test_df["fault_class"] != "HEALTHY").astype(int)

    def summarize_series(sub_df):
        if len(sub_df) == 0:
            return {
                "count": 0,
                "score_mean": 0.0,
                "score_std": 0.0,
                "score_p25": 0.0,
                "score_p50": 0.0,
                "score_p75": 0.0,
                "score_min": 0.0,
                "score_max": 0.0,
                "detection_rate": 0.0,
                "flagged_anomalous": 0
            }
        s = sub_df["anomaly_score"]
        p = sub_df["is_anomalous_pred"]
        return {
            "count": int(len(sub_df)),
            "score_mean": float(np.mean(s)),
            "score_std": float(np.std(s)),
            "score_p25": float(np.percentile(s, 25)),
            "score_p50": float(np.percentile(s, 50)),
            "score_p75": float(np.percentile(s, 75)),
            "score_min": float(np.min(s)),
            "score_max": float(np.max(s)),
            "detection_rate": float(np.mean(p)),
            "flagged_anomalous": int(np.sum(p))
        }

    # Breakdown by fault_class
    by_fault = {}
    for fc, group in test_df.groupby("fault_class"):
        by_fault[fc] = summarize_series(group)

    # Breakdown by severity
    by_severity = {}
    for sev, group in test_df.groupby("severity"):
        by_severity[str(sev)] = summarize_series(group)

    # Breakdown by load_pct
    by_load = {}
    for load_val, group in test_df.groupby("load_pct"):
        by_load[str(load_val)] = summarize_series(group)

    # Speed bins
    test_df["speed_band"] = pd.cut(
        test_df["estimated_speed_rpm"],
        bins=[0, 1435, 1445, 2000],
        labels=["low_speed (<1435 RPM)", "nominal (1435-1445 RPM)", "high_speed (>1445 RPM)"]
    )
    by_speed = {}
    for sb, group in test_df.groupby("speed_band", observed=False):
        by_speed[str(sb)] = summarize_series(group)

    # Cross breakdown: Fault Type x Severity (Detection sensitivity progression)
    fault_x_severity = {}
    faults = [c for c in test_df["fault_class"].unique() if c != "HEALTHY"]
    for fc in sorted(faults):
        fault_x_severity[fc] = {}
        sub_fc = test_df[test_df["fault_class"] == fc]
        for sev, group in sub_fc.groupby("severity"):
            fault_x_severity[fc][str(sev)] = {
                "count": int(len(group)),
                "detection_rate": float(np.mean(group["is_anomalous_pred"])),
                "score_mean": float(np.mean(group["anomaly_score"]))
            }

    diagnosis_report = {
        "model": "IsolationForest",
        "threshold": float(threshold),
        "threshold_criterion": "Youden's J statistic on Validation Split",
        "test_windows": int(len(test_df)),
        "overall_fpr": float(by_fault.get("HEALTHY", {}).get("detection_rate", 0.0)),
        "overall_fault_recall": float(test_df[test_df["fault_class"] != "HEALTHY"]["is_anomalous_pred"].mean()),
        "by_fault_class": by_fault,
        "by_severity": by_severity,
        "by_operating_load": by_load,
        "by_speed_band": by_speed,
        "fault_x_severity_sensitivity": fault_x_severity
    }

    out_file = os.path.join(artifacts_dir, "stage1_diagnosis.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(diagnosis_report, f, indent=2)

    print(f"[SUCCESS] Generated Stage 1 diagnosis artifact: {out_file}")
    print(f"  Overall Healthy FPR: {diagnosis_report['overall_fpr']*100:.2f}%")
    print(f"  Overall Fault Recall: {diagnosis_report['overall_fault_recall']*100:.2f}%")
    return diagnosis_report

if __name__ == "__main__":
    generate_stage1_diagnosis()
