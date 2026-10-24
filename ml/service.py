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
from fastapi import FastAPI, HTTPException, Request, Response, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure root path is accessible
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.csv_analyzer import (
    generate_csv_template,
    validate_and_parse_csv,
    analyze_ai4i_batch,
    analyze_motor_batch,
    AI4I_FIELD_GUIDE,
    MOTOR_FIELD_GUIDE
)

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

ai4i_model = None
ai4i_metrics = None
ai4i_test_cases = None
ai4i_features = None
ai4i_explainer = None

def load_artifacts():
    global anomaly_bundle, classifier_bundle, rul_bundle, rul_model, shap_explainer, global_importance_cache
    global ai4i_model, ai4i_metrics, ai4i_test_cases, ai4i_features, ai4i_explainer
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

    # 6. UCI AI4I 2020 Predictive Maintenance Benchmark Artifacts
    ai4i_dir = os.path.join(artifacts_dir, "ai4i")
    ai4i_model_path = os.path.join(ai4i_dir, "ai4i_champion_model.joblib")
    if os.path.exists(ai4i_model_path):
        ai4i_model = joblib.load(ai4i_model_path)
        try:
            import shap
            ai4i_explainer = shap.TreeExplainer(ai4i_model)
        except Exception as e:
            print(f"Notice: ai4i tree explainer: {e}")

    ai4i_metrics_path = os.path.join(ai4i_dir, "ai4i_evaluation_metrics.json")
    if os.path.exists(ai4i_metrics_path):
        with open(ai4i_metrics_path, "r") as f:
            ai4i_metrics = json.load(f)

    ai4i_test_cases_path = os.path.join(ai4i_dir, "ai4i_test_cases.json")
    if os.path.exists(ai4i_test_cases_path):
        with open(ai4i_test_cases_path, "r") as f:
            ai4i_test_cases = json.load(f)

    ai4i_features_path = os.path.join(ai4i_dir, "feature_names.json")
    if os.path.exists(ai4i_features_path):
        with open(ai4i_features_path, "r") as f:
            ai4i_features = json.load(f)

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

# --- UCI AI4I 2020 Predictive Maintenance Endpoints ---

class Ai4iPredictPayload(BaseModel):
    air_temp_k: float = Field(300.0, description="Air temperature in Kelvin")
    process_temp_k: float = Field(310.0, description="Process temperature in Kelvin")
    rotational_speed_rpm: float = Field(1500.0, description="Rotational speed in RPM")
    torque_nm: float = Field(40.0, description="Torque in Nm")
    tool_wear_min: float = Field(120.0, description="Tool wear time in minutes")
    machine_type: str = Field("M", description="Machine quality variant: L, M, or H")

@app.get("/ai4i/benchmark")
def get_ai4i_benchmark():
    if ai4i_metrics is None:
        raise HTTPException(status_code=404, detail="AI4I benchmark metrics not found.")
    return ai4i_metrics

@app.get("/metrics/motor")
def get_motor_metrics():
    """Return verified induction motor experimental metrics from artifacts."""
    artifacts_dir = ARTIFACTS_DIR
    res = {}
    for fname, key in [
        ("fault_classifier_metrics.json", "classifier"),
        ("rul_metrics.json", "rul"),
        ("anomaly_detector_metrics.json", "anomaly"),
        ("latency_metrics.json", "latency"),
        ("robustness_metrics.json", "robustness"),
        ("hyperparameters.json", "hyperparameters")
    ]:
        p = os.path.join(artifacts_dir, fname)
        if os.path.exists(p):
            with open(p, "r") as f:
                res[key] = json.load(f)
    return res

@app.get("/ai4i/test-cases")
def get_ai4i_test_cases():
    if ai4i_test_cases is None:
        raise HTTPException(status_code=404, detail="AI4I test cases not found.")
    return ai4i_test_cases

@app.post("/ai4i/predict")
def predict_ai4i(payload: Ai4iPredictPayload):
    if ai4i_model is None or ai4i_features is None:
        raise HTTPException(status_code=503, detail="AI4I model not loaded.")
        
    temp_diff = payload.process_temp_k - payload.air_temp_k
    power_w = payload.torque_nm * (payload.rotational_speed_rpm * 2 * np.pi / 60)
    overstrain = payload.tool_wear_min * payload.torque_nm
    type_code = {"L": 0, "M": 1, "H": 2}.get(payload.machine_type.upper(), 1)
    
    import pandas as pd
    row_dict = {
        "Air_temperature_K": payload.air_temp_k,
        "Process_temperature_K": payload.process_temp_k,
        "Rotational_speed_rpm": payload.rotational_speed_rpm,
        "Torque_Nm": payload.torque_nm,
        "Tool_wear_min": payload.tool_wear_min,
        "Temp_difference_K": temp_diff,
        "Mechanical_Power_W": power_w,
        "Overstrain_Metric": overstrain,
        "Type_Code": type_code
    }
    
    df_row = pd.DataFrame([row_dict])[ai4i_features]
    prob = float(ai4i_model.predict_proba(df_row)[0, 1])
    is_failure = bool(prob >= 0.5)
    
    # SHAP local attribution
    attributions = []
    if ai4i_explainer is not None:
        try:
            shap_vals = ai4i_explainer.shap_values(df_row)[0]
            for f, s in zip(ai4i_features, shap_vals):
                attributions.append({
                    "feature": f,
                    "value": round(float(df_row[f].values[0]), 2),
                    "shap_value": round(float(s), 4),
                    "direction": "INCREASES_FAILURE_RISK" if s > 0 else "DECREASES_RISK"
                })
            attributions = sorted(attributions, key=lambda a: abs(a["shap_value"]), reverse=True)
        except Exception as e:
            print(f"SHAP local error: {e}")
            
    risk_level = "CRITICAL" if prob >= 0.70 else ("ELEVATED" if prob >= 0.35 else "LOW")
    
    recommendation = "Normal operating baseline. Continue standard preventive inspection."
    if is_failure:
        if overstrain > 11000:
            recommendation = "Severe Overstrain Risk (OSF). Reduce shaft torque load and check tool wear limit immediately."
        elif temp_diff < 8.6 and payload.rotational_speed_rpm < 1380:
            recommendation = "Heat Dissipation Failure (HDF). Clean heat exchanger cooling ducts and verify convection airflow."
        elif power_w < 3500 or power_w > 9000:
            recommendation = "Power Supply Anomaly (PWF). Check line voltage and current feed for over/under-power excursion."
        elif payload.tool_wear_min > 200:
            recommendation = "Tool Wear Failure (TWF). Replace cutting tool insert before catastrophic workpiece fracture."
        else:
            recommendation = "Unrecognized Failure Anomaly. Inspect mechanical vibration and thermal dissipation."
            
    return {
        "is_failure_predicted": is_failure,
        "failure_probability": round(prob, 4),
        "risk_level": risk_level,
        "recommendation": recommendation,
        "evidence": row_dict,
        "top_shap_attributions": attributions[:6],
        "model_version": "xgboost_ai4i_champion_v1.0",
        "benchmark_dataset": "UCI AI4I 2020 Predictive Maintenance Dataset"
    }

# --- CSV Sensor Data Analysis Endpoints ---

class CsvTextPayload(BaseModel):
    csv_text: str

@app.get("/csv/templates/{mode}")
def get_csv_template(mode: str):
    """Download authoritative empty CSV template with exact required headers."""
    try:
        content = generate_csv_template(mode)
        filename = f"{mode.lower()}_sensor_template.csv"
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/csv/field-guide/{mode}")
def get_csv_field_guide(mode: str):
    """Get metadata schema field guide for offline CSV sensor entry."""
    if mode.lower() == "ai4i":
        return {
            "mode": "ai4i",
            "name": "UCI AI4I 2020 Benchmark Inference",
            "description": "Raw equipment physical variables for milling machine failure prediction",
            "fields": AI4I_FIELD_GUIDE
        }
    elif mode.lower() == "motor":
        return {
            "mode": "motor",
            "name": "Induction Motor Physics-Guided Features",
            "description": "26 MCSA current harmonics, vibration BPFO/kurtosis, and thermal rise features",
            "fields": MOTOR_FIELD_GUIDE
        }
    else:
        raise HTTPException(status_code=400, detail=f"Unknown mode '{mode}'. Choose 'ai4i' or 'motor'.")

@app.post("/csv/analyze/{mode}")
async def analyze_csv(mode: str, request: Request):
    """Parse, validate, and run batch offline inference with champion models and SHAP explanations."""
    content_type = request.headers.get("content-type", "")
    csv_str = ""
    if "multipart/form-data" in content_type:
        form = await request.form()
        uploaded_file = form.get("file")
        if uploaded_file and hasattr(uploaded_file, "read"):
            content_bytes = await uploaded_file.read()
            csv_str = content_bytes.decode("utf-8", errors="replace")
    elif "application/json" in content_type:
        body = await request.json()
        csv_str = body.get("csv_text", "")
    else:
        body_bytes = await request.body()
        csv_str = body_bytes.decode("utf-8", errors="replace")

    if not csv_str.strip():
        raise HTTPException(status_code=400, detail="No CSV data provided. Provide a file upload or JSON payload with 'csv_text'.")

    valid_rows, validation_errors = validate_and_parse_csv(csv_str, mode)
    
    analysis_results = []
    export_csv = ""
    
    if mode.lower() == "ai4i":
        if ai4i_model is None or ai4i_features is None:
            raise HTTPException(status_code=503, detail="AI4I model is not loaded.")
        if valid_rows:
            analysis_results, export_csv = analyze_ai4i_batch(valid_rows, ai4i_model, ai4i_explainer, ai4i_features)
    elif mode.lower() == "motor":
        if anomaly_bundle is None or classifier_bundle is None:
            raise HTTPException(status_code=503, detail="Motor models are not loaded.")
        if valid_rows:
            analysis_results, export_csv = analyze_motor_batch(valid_rows, anomaly_bundle, classifier_bundle, shap_explainer)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown mode '{mode}'. Choose 'ai4i' or 'motor'.")

    return {
        "mode": mode.lower(),
        "total_rows_received": len(valid_rows) + len(validation_errors),
        "valid_rows_count": len(valid_rows),
        "validation_errors": validation_errors,
        "analysis_results": analysis_results,
        "export_csv_content": export_csv
    }

@app.get("/reports/download/{fmt}")
def download_research_report(fmt: str):
    """Download the standalone research results report in DOCX or Markdown format."""
    fmt = fmt.lower()
    reports_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs", "reports")
    if fmt == "docx":
        file_path = os.path.join(reports_dir, "MACHINA_X_Experimental_Results.docx")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="DOCX report not found. Run generate_research_report.py first.")
        return FileResponse(
            path=file_path,
            filename="MACHINA_X_Experimental_Results.docx",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    elif fmt in ["md", "markdown"]:
        file_path = os.path.join(reports_dir, "MACHINA_X_Experimental_Results.md")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Markdown report not found.")
        return FileResponse(
            path=file_path,
            filename="MACHINA_X_Experimental_Results.md",
            media_type="text/markdown"
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Choose 'docx' or 'md'.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ml.service:app", host="0.0.0.0", port=8001, reload=False)
