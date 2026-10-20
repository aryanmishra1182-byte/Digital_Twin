"""
Integration Tests for FastAPI ML Microservice
"""

import pytest
import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from ml.service import app
from simulator.motor_simulator import MotorSimulator
from ml.features.feature_extractor import FeatureExtractor

client = TestClient(app)

def test_ml_service_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert data["anomaly_detector_loaded"] is True
    assert data["fault_classifier_loaded"] is True
    assert data["rul_model_loaded"] is True
    assert data["shap_explainer_loaded"] is True

def test_ml_service_extract_features():
    sim = MotorSimulator(seed=12)
    w = sim.generate_window(load_pct=100.0, fault_class="HEALTHY")
    payload = {
        "current_signal": w.current_signal.tolist(),
        "vibration_signal": w.vibration_signal.tolist(),
        "temperature_c": w.temperature_c,
        "load_pct": 100.0
    }
    response = client.post("/extract-features", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "features" in data
    assert "current_rms" in data["features"]
    assert "vib_kurtosis" in data["features"]

def test_ml_service_infer_and_explain():
    sim = MotorSimulator(seed=14)
    extractor = FeatureExtractor()
    w = sim.generate_window(load_pct=100.0, fault_class="BROKEN_ROTOR_BAR", severity=0.85)
    feats = extractor.extract_features(w.current_signal, w.vibration_signal, w.temperature_c)
    
    response = client.post("/infer", json={"features": feats})
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_fault_class"] == "BROKEN_ROTOR_BAR"
    assert data["confidence"] > 0.5
    assert "shap_explanation" in data
    assert len(data["shap_explanation"]["top_attributions"]) > 0

def test_ml_service_rul_insufficient_history():
    sim = MotorSimulator(seed=15)
    extractor = FeatureExtractor()
    w = sim.generate_window(load_pct=100.0, fault_class="BEARING_DEFECT", severity=0.5)
    feats = extractor.extract_features(w.current_signal, w.vibration_signal, w.temperature_c)
    
    # Send only 2 windows (requires at least 5)
    response = client.post("/predict-rul", json={"sequence": [feats, feats]})
    assert response.status_code == 400
    assert "Insufficient temporal history" in response.json()["detail"]

def test_ml_service_rul_valid_sequence():
    sim = MotorSimulator(seed=16)
    extractor = FeatureExtractor()
    seq = []
    for i in range(5):
        w = sim.generate_window(load_pct=100.0, fault_class="BEARING_DEFECT", severity=0.3 + 0.1 * i)
        feats = extractor.extract_features(w.current_signal, w.vibration_signal, w.temperature_c)
        seq.append(feats)

    response = client.post("/predict-rul", json={"sequence": seq})
    assert response.status_code == 200
    data = response.json()
    assert "estimated_rul_hours" in data
    assert data["unit"] == "hours"
    assert data["sequence_windows_used"] == 5

def test_ml_service_global_importance():
    response = client.get("/global-importance")
    assert response.status_code == 200
    data = response.json()
    assert "global_importance" in data
    assert len(data["global_importance"]) > 0
