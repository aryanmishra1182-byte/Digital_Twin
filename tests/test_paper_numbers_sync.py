"""
Test for synchronization between docs/paper_numbers.md and source JSON artifacts.
Asserts that no human has manually edited or deviated paper numbers from the empirical truth.
"""

import os
import json
import pytest

def test_paper_numbers_sync_with_json_artifacts():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    artifacts_dir = os.path.join(root, "ml", "artifacts")
    doc_path = os.path.join(root, "docs", "paper_numbers.md")

    assert os.path.exists(doc_path), "docs/paper_numbers.md must exist"
    with open(doc_path, "r", encoding="utf-8") as f:
        doc_content = f.read()

    # 1. Fault classifier sync
    fc_path = os.path.join(artifacts_dir, "fault_classifier_metrics.json")
    with open(fc_path, "r", encoding="utf-8") as f:
        fc = json.load(f)
    fc_acc_str = f"{fc['accuracy']*100:.2f}%"
    fc_f1_str = f"{fc['f1_macro']:.4f}"
    assert fc_acc_str in doc_content, f"XGBoost accuracy {fc_acc_str} missing from paper_numbers.md"
    assert fc_f1_str in doc_content, f"XGBoost macro F1 {fc_f1_str} missing from paper_numbers.md"

    # 2. Anomaly detector sync
    ad_path = os.path.join(artifacts_dir, "anomaly_detector_metrics.json")
    with open(ad_path, "r", encoding="utf-8") as f:
        ad = json.load(f)
    ad_recall_str = f"{ad['recall']*100:.2f}%"
    ad_f1_str = f"{ad['f1']:.4f}"
    assert ad_recall_str in doc_content, f"Isolation Forest recall {ad_recall_str} missing from paper_numbers.md"
    assert ad_f1_str in doc_content, f"Isolation Forest F1 {ad_f1_str} missing from paper_numbers.md"

    # 3. RUL model sync
    rul_path = os.path.join(artifacts_dir, "rul_metrics.json")
    with open(rul_path, "r", encoding="utf-8") as f:
        rul = json.load(f)
    rul_mae_str = f"{rul['mae_hours']:.4f}"
    rul_rmse_str = f"{rul['rmse_hours']:.4f}"
    assert rul_mae_str in doc_content, f"RUL MAE {rul_mae_str} missing from paper_numbers.md"
    assert rul_rmse_str in doc_content, f"RUL RMSE {rul_rmse_str} missing from paper_numbers.md"

    # 4. CWRU real physical data sync
    cwru_path = os.path.join(artifacts_dir, "real_data_cwru_metrics.json")
    with open(cwru_path, "r", encoding="utf-8") as f:
        cwru = json.load(f)
    within_acc = f"{cwru['within_dataset_performance']['accuracy']*100:.2f}%"
    k10_acc = f"{cwru['sim_to_real_fine_tuning_experiment']['k_10']['accuracy_mean']*100:.2f}%"
    assert within_acc in doc_content, f"CWRU within-dataset accuracy {within_acc} missing from paper_numbers.md"
    assert k10_acc in doc_content, f"CWRU k=10 fine-tuning accuracy {k10_acc} missing from paper_numbers.md"

    # 5. Locust load benchmark sync
    loc_path = os.path.join(artifacts_dir, "locust_benchmark.json")
    with open(loc_path, "r", encoding="utf-8") as f:
        loc = json.load(f)
    rps_str = f"{loc['requests_per_second']:.2f}"
    assert rps_str in doc_content, f"Locust RPS {rps_str} missing from paper_numbers.md"

    # 6. Latency & Platform Provenance Integrity
    lat_path = os.path.join(artifacts_dir, "latency_metrics.json")
    with open(lat_path, "r", encoding="utf-8") as f:
        lat = json.load(f)
    timed_cnt = lat.get("benchmark_metadata", {}).get("benchmark_windows_evaluated", 0)
    assert timed_cnt > 0, "latency_metrics.json benchmark_windows_evaluated must be > 0"
    assert f"{timed_cnt} timed" in doc_content, f"Expected '{timed_cnt} timed' in paper_numbers.md"
    assert "- **Platform:** N/A" not in doc_content, "Platform must not be N/A in paper_numbers.md"
    assert "- **Benchmark Workload:** 0 timed" not in doc_content, "Workload must not be 0 windows"

    # 7. Model selection partition & zero-window check
    assert "VALIDATION" in doc_content, "Model selection must report VALIDATION partition"
    assert "0 windows (0 runs)" not in doc_content, "Zero-window defect must not exist"
