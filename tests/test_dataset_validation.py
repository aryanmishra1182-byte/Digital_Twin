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
