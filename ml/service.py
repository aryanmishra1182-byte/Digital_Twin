"""
FastAPI Python ML Inference Microservice
========================================
Exposes high-performance REST APIs consumed by Spring Boot Digital Twin Backend:
- /health: model versions, status, metadata
- /extract-features: extracts MCSA, vibration, and thermal features
- /infer: complete orchestrated pipeline (anomaly -> classification -> SHAP)
- /predict-rul: sequence-based LSTM remaining useful life estimation
- /global-importance: global SHAP feature attributions
"""

import os
import sys
import json
import joblib
import numpy as np
import torch
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure root path is accessible
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.features.feature_extractor import FeatureExtractor, FEATURE_NAMES
from ml.explainability.shap_explainer import MotorShapExplainer
from simulator.motor_simulator import FAULT_CLASSES
from ml.training.train_rul_model import LSTMRULModel

from contextlib import asynccontextmanager

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")

# Global model state holders
feature_extractor = FeatureExtractor()
anomaly_bundle = None
classifier_bundle = None
rul_bundle = None
rul_model = None
shap_explainer = None
global_importance_cache = None

def load_artifacts():
    global anomaly_bundle, classifier_bundle, rul_bundle, rul_model, shap_explainer, global_importance_cache
    artifacts_dir = ARTIFACTS_DIR

    # 1. Anomaly Detector
    iso_path = os.path.join(artifacts_dir, "anomaly_detector.joblib")
    if os.path.exists(iso_path):
        anomaly_bundle = joblib.load(iso_path)
    
    # 2. Fault Classifier
    clf_path = os.path.join(artifacts_dir, "fault_classifier.joblib")
    if os.path.exists(clf_path):
        classifier_bundle = joblib.load(clf_path)

    # 3. SHAP Explainer
    if os.path.exists(clf_path):
        shap_explainer = MotorShapExplainer(clf_path)

    # 4. RUL LSTM Model
    rul_b_path = os.path.join(artifacts_dir, "rul_model_bundle.joblib")
    rul_m_path = os.path.join(artifacts_dir, "rul_lstm_model.pt")
    if os.path.exists(rul_b_path) and os.path.exists(rul_m_path):
        rul_bundle = joblib.load(rul_b_path)
        rul_model = LSTMRULModel(
            input_dim=rul_bundle["input_dim"],
            hidden_dim=rul_bundle["hidden_dim"],
            num_layers=rul_bundle["num_layers"]
        )
        rul_model.load_state_dict(torch.load(rul_m_path, weights_only=True))
        rul_model.eval()

    # 5. Global importance
    imp_path = os.path.join(artifacts_dir, "global_shap_importance.json")
    if os.path.exists(imp_path):
        with open(imp_path, "r") as f:
            global_importance_cache = json.load(f)

# Preload on import so test clients have models immediately loaded
load_artifacts()

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_artifacts()
    yield

app = FastAPI(
    title="Motor Digital Twin ML Service",
    description="Signal processing, anomaly detection, XGBoost fault classification, LSTM RUL, and SHAP explainability",
    version="1.0.0",
    lifespan=lifespan
)

# Pydantic Schemas
class RawSignalPayload(BaseModel):
    current_signal: List[float] = Field(..., description="1-second stator current array at 10 kHz")
    vibration_signal: List[float] = Field(..., description="1-second radial vibration array at 10 kHz")
    temperature_c: float
    prev_temperature_c: Optional[float] = None
    load_pct: float = 100.0

class FeatureVectorPayload(BaseModel):
    features: Dict[str, float]

class RulSequencePayload(BaseModel):
    sequence: List[Dict[str, float]] = Field(..., description="List of at least 5 chronological feature dictionaries")



@app.get("/health")
def health():
    return {
        "status": "UP",
        "service": "motor-digital-twin-ml-service",
        "anomaly_detector_loaded": anomaly_bundle is not None,
        "fault_classifier_loaded": classifier_bundle is not None,
        "rul_model_loaded": rul_model is not None,
        "shap_explainer_loaded": shap_explainer is not None,
        "anomaly_version": anomaly_bundle["model_version"] if anomaly_bundle else None,
        "classifier_version": classifier_bundle["model_version"] if classifier_bundle else None,
        "rul_version": rul_bundle["model_version"] if rul_bundle else None,
        "feature_count": len(FEATURE_NAMES),
        "provenance": "Synthetic Simulation (IEEE Paper Spec 3kW 415V Motor)"
    }

@app.post("/extract-features")
def extract_features(payload: RawSignalPayload):
    try:
        current = np.array(payload.current_signal, dtype=np.float64)
        vibration = np.array(payload.vibration_signal, dtype=np.float64)
        feats = feature_extractor.extract_features(
            current_signal=current,
            vibration_signal=vibration,
            temperature_c=payload.temperature_c,
            prev_temperature_c=payload.prev_temperature_c,
            load_pct=payload.load_pct
        )
        return {"features": feats}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/infer")
def infer(payload: FeatureVectorPayload):
    """
    Orchestrated multi-stage inference:
    1. Score anomaly with Isolation Forest
    2. Classify fault with XGBoost
    3. Generate local SHAP explanation
    """
    if anomaly_bundle is None or classifier_bundle is None or shap_explainer is None:
        raise HTTPException(
            status_code=503,
            detail="ML models not loaded or training incomplete. Run scripts/train_all_models.py"
        )

    feats = payload.features
    # Check feature presence
    missing = [f for f in FEATURE_NAMES if f not in feats]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing features: {missing}")

    vec = feature_extractor.to_feature_vector(feats)
    vec_2d = vec.reshape(1, -1)

    # Stage 1: Anomaly Detection
    iso_scaler = anomaly_bundle["scaler"]
    iso_model = anomaly_bundle["model"]
    vec_iso_scaled = iso_scaler.transform(vec_2d)
    
    raw_score = float(iso_model.decision_function(vec_iso_scaled)[0])
    raw_pred = int(iso_model.predict(vec_iso_scaled)[0])  # -1 = anomaly, 1 = inlier
    is_anomaly = (raw_pred == -1)
    # Normalized anomaly score [0.0, 1.0]
    anomaly_score = float(np.clip(1.0 - (raw_score + 0.3) / 0.6, 0.0, 1.0))

    # Stage 2: Fault Classification
    clf_scaler = classifier_bundle["scaler"]
    clf_model = classifier_bundle["model"]
    idx_to_class = classifier_bundle["idx_to_class"]

    vec_clf_scaled = clf_scaler.transform(vec_2d)
    probs = clf_model.predict_proba(vec_clf_scaled)[0]
    pred_idx = int(np.argmax(probs))
    pred_class = idx_to_class[pred_idx]
    confidence = float(probs[pred_idx])

    # Unrecognized anomaly handling
    if is_anomaly and confidence < 0.45:
        pred_class = "UNKNOWN_ANOMALY"

    # Stage 5: SHAP Explanation
    shap_res = shap_explainer.explain_prediction(vec, top_k=6)

    return {
        "is_anomaly": is_anomaly,
        "anomaly_score": round(anomaly_score, 4),
        "anomaly_decision": "ANOMALOUS" if is_anomaly else "NORMAL",
        "predicted_fault_class": pred_class,
        "confidence": round(confidence, 4),
        "class_probabilities": {idx_to_class[i]: round(float(probs[i]), 4) for i in range(len(probs))},
        "model_versions": {
            "anomaly_detector": anomaly_bundle["model_version"],
            "fault_classifier": classifier_bundle["model_version"]
        },
        "shap_explanation": {
            "top_attributions": shap_res["top_attributions"],
            "explanation_method": shap_res["explanation_method"]
        }
    }

@app.post("/predict-rul")
def predict_rul(payload: RulSequencePayload):
    """Estimate RUL using PyTorch LSTM sequence regressor."""
    if rul_model is None or rul_bundle is None:
        raise HTTPException(status_code=503, detail="RUL LSTM model not loaded.")

    seq_len = rul_bundle["sequence_length"]
    if len(payload.sequence) < seq_len:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient temporal history for RUL estimation. Requires at least {seq_len} consecutive feature windows; got {len(payload.sequence)}."
        )

    # Take last seq_len windows
    recent_sequence = payload.sequence[-seq_len:]
    scaler = rul_bundle["scaler"]
    
    raw_matrix = np.array([
        feature_extractor.to_feature_vector(win) for win in recent_sequence
    ], dtype=np.float32)

    scaled_matrix = scaler.transform(raw_matrix)
    seq_tensor = torch.tensor(scaled_matrix, dtype=torch.float32).unsqueeze(0)  # (1, seq_len, features)

    with torch.no_grad():
        est_rul = float(rul_model(seq_tensor).item())
    
    # Non-negative RUL
    est_rul = max(0.0, est_rul)

    return {
        "estimated_rul_hours": round(est_rul, 2),
        "unit": "hours",
        "sequence_windows_used": seq_len,
        "model_version": rul_bundle["model_version"],
        "limitations": "Evaluated against simulated degradation trajectory; physical bench validation required."
    }

@app.get("/global-importance")
def get_global_importance():
    if global_importance_cache is None:
        raise HTTPException(status_code=404, detail="Global importance artifact not found.")
    return global_importance_cache

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ml.service:app", host="0.0.0.0", port=8001, reload=False)
