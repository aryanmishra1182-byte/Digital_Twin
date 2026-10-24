"""
Stage 1: Anomaly Detection Training and Evaluation
=================================================
Trains an Isolation Forest anomaly detector primarily on HEALTHY operation data.
Selects optimal decision threshold on the VALIDATION split to maximize F1.
Evaluates on the held-out TEST split.
Saves model artifact, threshold, metadata, and evaluation metrics.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix, roc_auc_score
from ml.features.feature_extractor import FEATURE_NAMES

MODEL_VERSION = "iso_forest_v1.0"

def train_anomaly_detector(
    data_dir: str = "data/processed",
    output_dir: str = "ml/artifacts",
    random_state: int = 42
) -> dict:
    os.makedirs(output_dir, exist_ok=True)
    train_df = pd.read_csv(os.path.join(data_dir, "dataset_train.csv"))
    val_df = pd.read_csv(os.path.join(data_dir, "dataset_val.csv"))
    test_df = pd.read_csv(os.path.join(data_dir, "dataset_test.csv"))

    # Train Isolation Forest on HEALTHY data (unsupervised normal envelope)
    healthy_train = train_df[train_df["fault_class"] == "HEALTHY"]
    X_train_healthy = healthy_train[FEATURE_NAMES].values

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_healthy)

    # Train Isolation Forest
    iso_forest = IsolationForest(
        n_estimators=150,
        max_samples="auto",
        contamination=0.05,
        random_state=random_state
    )
    iso_forest.fit(X_train_scaled)

    # Threshold tuning on Validation split using Youden's J statistic (TPR - FPR)
    # decision_function: lower means more abnormal
    y_val_ground_truth = (val_df["fault_class"] != "HEALTHY").astype(int).values
    X_val_scaled = scaler.transform(val_df[FEATURE_NAMES].values)
    val_scores = -iso_forest.decision_function(X_val_scaled)  # higher = more anomalous

    best_thresh = float(np.median(val_scores))
    best_j = -1.0
    for cand in np.percentile(val_scores, np.linspace(0.5, 99.5, 200)):
        pred_cand = (val_scores > cand).astype(int)
        tn_val, fp_val, fn_val, tp_val = confusion_matrix(y_val_ground_truth, pred_cand).ravel()
        tpr = tp_val / (tp_val + fn_val) if (tp_val + fn_val) > 0 else 0.0
        fpr_val = fp_val / (fp_val + tn_val) if (fp_val + tn_val) > 0 else 0.0
        j_stat = tpr - fpr_val
        if j_stat > best_j:
            best_j = j_stat
            best_thresh = float(cand)

    # Evaluate on held-out test set
    y_test_ground_truth = (test_df["fault_class"] != "HEALTHY").astype(int).values
    X_test_scaled = scaler.transform(test_df[FEATURE_NAMES].values)
    test_scores = -iso_forest.decision_function(X_test_scaled)
    binary_preds = (test_scores > best_thresh).astype(int)

    precision = float(precision_score(y_test_ground_truth, binary_preds, zero_division=0))
    recall = float(recall_score(y_test_ground_truth, binary_preds, zero_division=0))
    f1 = float(f1_score(y_test_ground_truth, binary_preds, zero_division=0))
    roc_auc = float(roc_auc_score(y_test_ground_truth, test_scores))
    cm = confusion_matrix(y_test_ground_truth, binary_preds).tolist()
    tn, fp, fn, tp = confusion_matrix(y_test_ground_truth, binary_preds).ravel()
    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0

    metrics = {
        "model_version": MODEL_VERSION,
        "algorithm": "IsolationForest",
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "roc_auc": roc_auc,
        "false_positive_rate": fpr,
        "threshold": best_thresh,
        "confusion_matrix": cm,
        "test_samples": len(test_df),
        "healthy_samples": int((test_df["fault_class"] == "HEALTHY").sum()),
        "faulty_samples": int((test_df["fault_class"] != "HEALTHY").sum()),
        "provenance": "Synthetic Simulation (IEEE Motor Benchmark)"
    }

    # Save artifact bundle
    bundle = {
        "model": iso_forest,
        "scaler": scaler,
        "threshold": best_thresh,
        "feature_names": FEATURE_NAMES,
        "model_version": MODEL_VERSION,
        "metrics": metrics
    }
    artifact_path = os.path.join(output_dir, "anomaly_detector.joblib")
    joblib.dump(bundle, artifact_path)

    metrics_path = os.path.join(output_dir, "anomaly_detector_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Anomaly detector trained and saved to {artifact_path}")
    print(f"Metrics: F1={f1:.4f}, Precision={precision:.4f}, Recall={recall:.4f}, FPR={fpr:.4f}, ROC_AUC={roc_auc:.4f}")
    return metrics

if __name__ == "__main__":
    train_anomaly_detector()
