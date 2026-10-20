"""
End-to-End Tests for ML Pipeline and SHAP Explainability
"""

import pytest
import os
import sys
import numpy as np
import joblib

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from simulator.motor_simulator import MotorSimulator
from ml.features.feature_extractor import FeatureExtractor
from ml.explainability.shap_explainer import MotorShapExplainer

def test_anomaly_detector_artifact():
    artifact_path = "ml/artifacts/anomaly_detector.joblib"
    assert os.path.exists(artifact_path)
    bundle = joblib.load(artifact_path)
    model = bundle["model"]
    scaler = bundle["scaler"]

    sim = MotorSimulator(seed=77)
    extractor = FeatureExtractor()
    w_healthy = sim.generate_window(load_pct=100.0, fault_class="HEALTHY")
    f_healthy = extractor.extract_features(w_healthy.current_signal, w_healthy.vibration_signal, w_healthy.temperature_c)
    vec = extractor.to_feature_vector(f_healthy).reshape(1, -1)
    vec_scaled = scaler.transform(vec)

    pred = model.predict(vec_scaled)[0]
    # Predict 1 for inlier / normal
    assert pred == 1

def test_fault_classifier_artifact_and_probabilities():
    artifact_path = "ml/artifacts/fault_classifier.joblib"
    assert os.path.exists(artifact_path)
    bundle = joblib.load(artifact_path)
    model = bundle["model"]
    scaler = bundle["scaler"]
    idx_to_class = bundle["idx_to_class"]

    sim = MotorSimulator(seed=88)
    extractor = FeatureExtractor()
    w_brb = sim.generate_window(load_pct=100.0, fault_class="BROKEN_ROTOR_BAR", severity=0.8)
    f_brb = extractor.extract_features(w_brb.current_signal, w_brb.vibration_signal, w_brb.temperature_c)
    vec = extractor.to_feature_vector(f_brb).reshape(1, -1)
    vec_scaled = scaler.transform(vec)

    probs = model.predict_proba(vec_scaled)[0]
    assert len(probs) == 5
    assert np.isclose(np.sum(probs), 1.0)
    pred_idx = np.argmax(probs)
    pred_class = idx_to_class[pred_idx]
    assert pred_class == "BROKEN_ROTOR_BAR"

def test_shap_explanation_and_physics_consistency():
    explainer = MotorShapExplainer()
    sim = MotorSimulator(seed=99)
    extractor = FeatureExtractor()

    # 1. Broken rotor bar: check sideband features are in top contributors
    w_brb = sim.generate_window(load_pct=100.0, fault_class="BROKEN_ROTOR_BAR", severity=0.9)
    f_brb = extractor.extract_features(w_brb.current_signal, w_brb.vibration_signal, w_brb.temperature_c)
    vec_brb = extractor.to_feature_vector(f_brb)
    exp_brb = explainer.explain_prediction(vec_brb, top_k=5)

    assert exp_brb["predicted_class"] == "BROKEN_ROTOR_BAR"
    assert exp_brb["confidence"] > 0.5
    top_feature_names = [a["feature_name"] for a in exp_brb["top_attributions"]]
    # Should include current sideband or THD features
    assert any("brb" in name or "current" in name for name in top_feature_names)

    # 2. Bearing defect: check vibration kurtosis / BPFO in top contributors
    w_bearing = sim.generate_window(load_pct=100.0, fault_class="BEARING_DEFECT", severity=0.9)
    f_bearing = extractor.extract_features(w_bearing.current_signal, w_bearing.vibration_signal, w_bearing.temperature_c)
    vec_bearing = extractor.to_feature_vector(f_bearing)
    exp_bearing = explainer.explain_prediction(vec_bearing, top_k=5)

    assert exp_bearing["predicted_class"] == "BEARING_DEFECT"
    top_bearing_feats = [a["feature_name"] for a in exp_bearing["top_attributions"]]
    assert any("vib" in name for name in top_bearing_feats)
