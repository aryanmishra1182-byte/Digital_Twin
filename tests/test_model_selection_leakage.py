"""
Regression Test: Verify Model Selection Procedure Cannot Read Test Metrics
==========================================================================
Verifies that:
1. scripts/run_model_selection.py evaluates candidate models strictly on the
   validation partition (dataset_val.csv).
2. The selection decision and candidate metrics are completely immune to test-set
   absence, test-set corruption, or test metric poisoning.
3. No test-set performance metrics leak into ml/artifacts/model_selection.json.
"""

import os
import sys
import json
import pytest
import shutil
import tempfile

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from scripts.run_model_selection import run_model_selection

def _ensure_val_dataset(root: str) -> str:
    val_path = os.path.join(root, "data", "processed", "dataset_val.csv")
    if not os.path.exists(val_path):
        os.makedirs(os.path.dirname(val_path), exist_ok=True)
        from simulator.motor_simulator import FAULT_CLASSES
        from ml.features.feature_extractor import FEATURE_NAMES
        import numpy as np
        import pandas as pd
        rows = []
        rng = np.random.RandomState(42)
        for fc in FAULT_CLASSES:
            for _ in range(20):
                row = {f: float(rng.uniform(0.1, 10.0)) for f in FEATURE_NAMES}
                row["fault_class"] = fc
                row["split"] = "val"
                rows.append(row)
        pd.DataFrame(rows).to_csv(val_path, index=False)
    return val_path

def test_model_selection_uses_validation_metrics_only():
    """Verify that model_selection.json records validation metrics and forbids test metrics."""
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    _ensure_val_dataset(root)
    artifacts_dir = os.path.join(root, "ml", "artifacts")

    # Run model selection
    decision = run_model_selection(artifacts_dir=artifacts_dir)

    assert decision["evaluation_partition"].startswith("VALIDATION")
    assert "STRICTLY FORBIDDEN" in decision["algorithmic_criteria"]["test_set_access"]

    s1_candidates = decision["stage_1_anomaly_detection"]["candidate_models"]
    for name, cdata in s1_candidates.items():
        assert "validation_f1_score" in cdata, f"{name} must record validation_f1_score"
        assert "test_f1" not in cdata, f"{name} must NOT leak test_f1"

    s2_candidates = decision["stage_2_fault_classification"]["candidate_models"]
    for name, cdata in s2_candidates.items():
        assert "validation_macro_f1" in cdata, f"{name} must record validation_macro_f1"
        assert "validation_accuracy" in cdata, f"{name} must record validation_accuracy"
        assert "test_accuracy" not in cdata, f"{name} must NOT leak test_accuracy"
        assert "test_macro_f1" not in cdata, f"{name} must NOT leak test_macro_f1"


def test_model_selection_immune_to_test_set_absence_and_poisoning(tmp_path):
    """Verify that model selection succeeds and produces identical results even if test set is missing or poisoned."""
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    _ensure_val_dataset(root)
    orig_artifacts = os.path.join(root, "ml", "artifacts")
    orig_data = os.path.join(root, "data", "processed")

    # Create temporary data dir containing ONLY dataset_val.csv (NO dataset_test.csv)
    temp_data_dir = str(tmp_path / "data")
    os.makedirs(temp_data_dir, exist_ok=True)
    shutil.copy(os.path.join(orig_data, "dataset_val.csv"), os.path.join(temp_data_dir, "dataset_val.csv"))

    # Assert test set definitely does NOT exist in temp_data_dir
    assert not os.path.exists(os.path.join(temp_data_dir, "dataset_test.csv"))

    # Create temporary artifacts dir with copies of model bundles
    temp_art_dir = str(tmp_path / "artifacts")
    os.makedirs(temp_art_dir, exist_ok=True)
    essential_files = [
        "latency_metrics.json", "anomaly_detector.joblib", "autoencoder_metrics.json",
        "fault_classifier.joblib", "rf_model.joblib", "svm_model.joblib", "cnn_1d_metrics.json"
    ]
    for ef in essential_files:
        src = os.path.join(orig_artifacts, ef)
        if os.path.exists(src):
            shutil.copy(src, os.path.join(temp_art_dir, ef))

    # Also simulate "poisoned" test metrics file in temp artifacts
    poisoned_fc = {
        "accuracy": 0.0001,
        "f1_macro": 0.0001,
        "per_class_metrics": {}
    }
    with open(os.path.join(temp_art_dir, "fault_classifier_metrics.json"), "w") as f:
        json.dump(poisoned_fc, f)

    # Run model selection pointing to temp directories
    decision = run_model_selection(data_dir=temp_data_dir, artifacts_dir=temp_art_dir)

    # Check that XGBoost is still selected because validation metrics are > 0.95, ignoring the poisoned test metric
    assert decision["stage_2_fault_classification"]["selected_champion"] == "XGBoost"
    xgb_c = decision["stage_2_fault_classification"]["candidate_models"]["XGBoost"]
    assert xgb_c["validation_accuracy"] > 0.90, "Must be computed on validation split, not poisoned test metric"
    assert xgb_c["validation_macro_f1"] > 0.90


def test_model_selection_fails_cleanly_on_missing_artifact(tmp_path):
    """Verify that model selection does NOT silently substitute research fallbacks when an artifact is missing."""
    temp_data_dir = str(tmp_path / "data")
    os.makedirs(temp_data_dir, exist_ok=True)
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    _ensure_val_dataset(root)
    shutil.copy(os.path.join(root, "data", "processed", "dataset_val.csv"), os.path.join(temp_data_dir, "dataset_val.csv"))

    # Missing latency metrics
    temp_art_dir = str(tmp_path / "artifacts")
    os.makedirs(temp_art_dir, exist_ok=True)

    with pytest.raises(FileNotFoundError, match="Missing latency metrics"):
        run_model_selection(data_dir=temp_data_dir, artifacts_dir=temp_art_dir)

