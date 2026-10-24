"""
Tests for Data Leakage Prevention and Dataset Validation
"""

import pytest
import os
import sys
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from ml.datasets.dataset_generator import generate_full_dataset
from ml.features.feature_extractor import FEATURE_NAMES

def test_dataset_generation_and_leakage_prevention(tmp_path):
    output_dir = str(tmp_path / "test_data")
    df, meta = generate_full_dataset(
        output_dir=output_dir,
        runs_per_condition=4,
        windows_per_run=3,
        loads=[50.0, 100.0],
        seed=99
    )

    # 1. Check file generation
    assert os.path.exists(os.path.join(output_dir, "dataset_full.csv"))
    assert os.path.exists(os.path.join(output_dir, "dataset_train.csv"))
    assert os.path.exists(os.path.join(output_dir, "dataset_val.csv"))
    assert os.path.exists(os.path.join(output_dir, "dataset_test.csv"))
    assert os.path.exists(os.path.join(output_dir, "dataset_metadata.json"))

    # 2. Check no missing or infinite values in feature columns
    for col in FEATURE_NAMES:
        assert col in df.columns
        assert not df[col].isnull().any(), f"Column {col} has null values"
        assert np.isfinite(df[col]).all(), f"Column {col} has infinite values"

    # 3. CRITICAL: Leakage test - verify Run IDs do not overlap across partitions
    train_runs = set(df[df["split"] == "train"]["run_id"])
    val_runs = set(df[df["split"] == "val"]["run_id"])
    test_runs = set(df[df["split"] == "test"]["run_id"])

    assert len(train_runs.intersection(val_runs)) == 0, "Train and Validation partitions share run_ids!"
    assert len(train_runs.intersection(test_runs)) == 0, "Train and Test partitions share run_ids!"
    assert len(val_runs.intersection(test_runs)) == 0, "Validation and Test partitions share run_ids!"

    # 4. Check all 5 classes are represented
    assert len(df["fault_class"].unique()) == 5

    # 5. Check metadata counts are non-zero and match partition rows
    assert meta["total_samples"] > 0
    assert meta["train_samples"] > 0
    assert meta["val_samples"] > 0
    assert meta["test_samples"] > 0
    assert meta["total_samples"] == meta["train_samples"] + meta["val_samples"] + meta["test_samples"]
    assert meta["train_samples"] == len(df[df["split"] == "train"])
    assert meta["val_samples"] == len(df[df["split"] == "val"])
    assert meta["test_samples"] == len(df[df["split"] == "test"])


def test_processed_dataset_metadata_integrity():
    """Verify that existing production data/processed/dataset_metadata.json reports non-zero counts."""
    meta_path = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "dataset_metadata.json")
    if os.path.exists(meta_path):
        import json
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        assert meta.get("total_samples", 0) > 0, "Dataset total_samples must be non-zero"
        assert meta.get("train_samples", 0) > 0, "Dataset train_samples must be non-zero"
        assert meta.get("val_samples", 0) > 0, "Dataset val_samples must be non-zero"
        assert meta.get("test_samples", 0) > 0, "Dataset test_samples must be non-zero"
        assert meta.get("total_runs", 0) > 0, "Dataset total_runs must be non-zero"

