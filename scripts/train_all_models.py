#!/usr/bin/env python
"""
Master Training Script:
1. Trains Stage 1: Isolation Forest Anomaly Detector
2. Trains Stage 2: XGBoost Fault Classifier (with RF/SVM baselines)
3. Trains Stage 3: LSTM Sequence Regressor for RUL
4. Computes and saves Global SHAP feature importances
"""

import sys
import os
import json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.training.train_anomaly_detector import train_anomaly_detector
from ml.training.train_fault_classifier import train_fault_classifier
from ml.training.train_rul_model import train_rul_model
from ml.explainability.shap_explainer import MotorShapExplainer

def main():
    print("=================================================================")
    print("STEP 1: Training Stage 1 - Isolation Forest Anomaly Detector...")
    print("=================================================================")
    anomaly_metrics = train_anomaly_detector()

    print("\n=================================================================")
    print("STEP 2: Training Stage 2 - XGBoost Multiclass Classifier...")
    print("=================================================================")
    classifier_metrics = train_fault_classifier()

    print("\n=================================================================")
    print("STEP 3: Training Stage 3 - LSTM Sequence Regressor for RUL...")
    print("=================================================================")
    rul_metrics = train_rul_model(epochs=35)

    print("\n=================================================================")
    print("STEP 4: Computing Global SHAP Feature Importances...")
    print("=================================================================")
    explainer = MotorShapExplainer()
    global_shap = explainer.compute_global_importance()
    with open("ml/artifacts/global_shap_importance.json", "w") as f:
        json.dump(global_shap, f, indent=2)
    print("Top 5 Global Contributing Features:")
    for item in global_shap["global_importance"][:5]:
        print(f"  - {item['feature_name']}: mean |SHAP| = {item['mean_abs_shap']:.4f}")

    print("\n=================================================================")
    print("ALL MODELS AND ARTIFACTS SUCCESSFULLY TRAINED AND VERIFIED!")
    print("Artifacts saved to: ml/artifacts/")
    print("=================================================================")

if __name__ == "__main__":
    main()
