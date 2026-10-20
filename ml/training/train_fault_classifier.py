"""
Stage 2: Fault Classification Training and Evaluation
====================================================
Trains XGBoost multiclass classifier across:
- HEALTHY
- BROKEN_ROTOR_BAR
- STATOR_INTER_TURN_SHORT
- BEARING_DEFECT
- AIR_GAP_ECCENTRICITY

Also trains and compares against Random Forest and SVM baselines.
Saves model artifact, class mapping, feature names, and evaluation reports.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score
from simulator.motor_simulator import FAULT_CLASSES
from ml.features.feature_extractor import FEATURE_NAMES

MODEL_VERSION = "xgboost_classifier_v1.0"

def train_fault_classifier(
    data_dir: str = "data/processed",
    output_dir: str = "ml/artifacts",
    random_state: int = 42
) -> dict:
    os.makedirs(output_dir, exist_ok=True)
    train_df = pd.read_csv(os.path.join(data_dir, "dataset_train.csv"))
    val_df = pd.read_csv(os.path.join(data_dir, "dataset_val.csv"))
    test_df = pd.read_csv(os.path.join(data_dir, "dataset_test.csv"))

    # Map classes to integers
    class_to_idx = {name: idx for idx, name in enumerate(FAULT_CLASSES)}
    idx_to_class = {idx: name for idx, name in enumerate(FAULT_CLASSES)}

    X_train = train_df[FEATURE_NAMES].values
    y_train = train_df["fault_class"].map(class_to_idx).values

    X_val = val_df[FEATURE_NAMES].values
    y_val = val_df["fault_class"].map(class_to_idx).values

    X_test = test_df[FEATURE_NAMES].values
    y_test = test_df["fault_class"].map(class_to_idx).values

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    # 1. Train Proposed Candidate: XGBoost
    xgb = XGBClassifier(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="multi:softprob",
        num_class=len(FAULT_CLASSES),
        random_state=random_state,
        eval_metric="mlogloss"
    )
    xgb.fit(
        X_train_scaled, y_train,
        eval_set=[(X_val_scaled, y_val)],
        verbose=False
    )
    y_pred_xgb = xgb.predict(X_test_scaled)
    acc_xgb = float(accuracy_score(y_test, y_pred_xgb))
    f1_macro_xgb = float(f1_score(y_test, y_pred_xgb, average="macro"))

    # 2. Baseline 1: Random Forest
    rf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=random_state)
    rf.fit(X_train_scaled, y_train)
    y_pred_rf = rf.predict(X_test_scaled)
    acc_rf = float(accuracy_score(y_test, y_pred_rf))
    f1_macro_rf = float(f1_score(y_test, y_pred_rf, average="macro"))

    # 3. Baseline 2: Support Vector Machine (RBF)
    svm = SVC(kernel="rbf", probability=True, random_state=random_state)
    svm.fit(X_train_scaled, y_train)
    y_pred_svm = svm.predict(X_test_scaled)
    acc_svm = float(accuracy_score(y_test, y_pred_svm))
    f1_macro_svm = float(f1_score(y_test, y_pred_svm, average="macro"))

    # Per-class report for XGBoost
    clf_report = classification_report(
        y_test, y_pred_xgb,
        target_names=FAULT_CLASSES,
        output_dict=True,
        zero_division=0
    )
    cm_xgb = confusion_matrix(y_test, y_pred_xgb).tolist()

    evaluation_summary = {
        "model_version": MODEL_VERSION,
        "primary_model": "XGBoost",
        "accuracy": acc_xgb,
        "f1_macro": f1_macro_xgb,
        "confusion_matrix": cm_xgb,
        "per_class_metrics": {cls: clf_report[cls] for cls in FAULT_CLASSES},
        "baseline_comparison": {
            "XGBoost": {"accuracy": acc_xgb, "f1_macro": f1_macro_xgb},
            "RandomForest": {"accuracy": acc_rf, "f1_macro": f1_macro_rf},
            "SVM": {"accuracy": acc_svm, "f1_macro": f1_macro_svm}
        },
        "test_samples": len(test_df),
        "class_mapping": class_to_idx,
        "provenance": "Synthetic Simulation (IEEE Paper Spec 3kW 415V Motor)"
    }

    # Save artifact bundle
    bundle = {
        "model": xgb,
        "scaler": scaler,
        "feature_names": FEATURE_NAMES,
        "class_to_idx": class_to_idx,
        "idx_to_class": idx_to_class,
        "model_version": MODEL_VERSION,
        "evaluation_summary": evaluation_summary
    }
    artifact_path = os.path.join(output_dir, "fault_classifier.joblib")
    joblib.dump(bundle, artifact_path)

    metrics_path = os.path.join(output_dir, "fault_classifier_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(evaluation_summary, f, indent=2)

    print(f"XGBoost Fault Classifier trained and saved to {artifact_path}")
    print(f"XGBoost Test Accuracy: {acc_xgb*100:.2f}%, F1-macro: {f1_macro_xgb:.4f}")
    print(f"Random Forest Baseline Accuracy: {acc_rf*100:.2f}%, F1-macro: {f1_macro_rf:.4f}")
    print(f"SVM Baseline Accuracy: {acc_svm*100:.2f}%, F1-macro: {f1_macro_svm:.4f}")
    return evaluation_summary

if __name__ == "__main__":
    train_fault_classifier()
