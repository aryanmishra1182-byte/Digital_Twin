"""
Stage 1: Anomaly Detection Training and Evaluation
=================================================
Trains an Isolation Forest anomaly detector primarily on HEALTHY operation data.
Saves model artifact, threshold, metadata, and evaluation metrics.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix
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
        contamination=0.05,  # expected nominal outlier fraction in healthy
        random_state=random_state
    )
    iso_forest.fit(X_train_scaled)

    # Evaluate on held-out test set
    # Ground truth: 1 for anomaly (faulty), 0 for normal (healthy)
    y_test_ground_truth = (test_df["fault_class"] != "HEALTHY").astype(int).values
    X_test_scaled = scaler.transform(test_df[FEATURE_NAMES].values)

    # decision_function: lower means more abnormal
    raw_scores = iso_forest.decision_function(X_test_scaled)
    # Convert to anomaly score in [0, 1] where 1.0 is highly anomalous
    anomaly_scores = 1.0 - (raw_scores - raw_scores.min()) / (raw_scores.max() - raw_scores.min() + 1e-6)
    
    # IsolationForest predict returns -1 for anomaly, 1 for inlier
    raw_preds = iso_forest.predict(X_test_scaled)
    binary_preds = (raw_preds == -1).astype(int)

    precision = float(precision_score(y_test_ground_truth, binary_preds, zero_division=0))
    recall = float(recall_score(y_test_ground_truth, binary_preds, zero_division=0))
    f1 = float(f1_score(y_test_ground_truth, binary_preds, zero_division=0))
    cm = confusion_matrix(y_test_ground_truth, binary_preds).tolist()
    # False Positive Rate = FP / (FP + TN)
    tn, fp, fn, tp = confusion_matrix(y_test_ground_truth, binary_preds).ravel()
    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0

    metrics = {
        "model_version": MODEL_VERSION,
        "algorithm": "IsolationForest",
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "false_positive_rate": fpr,
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
    print(f"Metrics: F1={f1:.4f}, Precision={precision:.4f}, Recall={recall:.4f}, FPR={fpr:.4f}")
    return metrics

if __name__ == "__main__":
    train_anomaly_detector()
