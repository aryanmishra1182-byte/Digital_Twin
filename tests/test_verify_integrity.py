"""
Automated Verification Suite for scripts/verify_integrity.py
============================================================
Exercises the integrity verifier against:
1. Missing required artifact.
2. Malformed JSON.
3. Canonical metric differing from generated report.
4. Wrong metric labeled as full-pipeline latency (e.g. 3.25 ms substituted for 32.80 ms).
5. AI4I macro F1 incorrectly labeled as binary F1.
6. Stale report remaining after source artifact changes.
7. Missing value silently replaced with hardcoded fallback.
8. Threshold inconsistent with evaluation artifact.
9. Report containing obsolete headline result (e.g. 99.85% AI4I accuracy).
10. Valid, consistent set of artifacts passes cleanly.
"""

import os
import sys
import json
import pytest
import shutil
import tempfile

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from scripts.verify_integrity import run_integrity_verification

@pytest.fixture
def clean_mock_workspace(tmp_path):
    """Creates a temporary workspace mirroring production directory structure with consistent mock artifacts."""
    root = str(tmp_path)
    data_dir = os.path.join(root, "data", "processed")
    artifacts_dir = os.path.join(root, "ml", "artifacts")
    ai4i_dir = os.path.join(artifacts_dir, "ai4i")
    docs_dir = os.path.join(root, "docs")
    reports_dir = os.path.join(docs_dir, "reports")
    fe_dir = os.path.join(root, "frontend", "src")
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(ai4i_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)
    os.makedirs(os.path.join(fe_dir, "pages"), exist_ok=True)
    os.makedirs(os.path.join(fe_dir, "components", "equipment"), exist_ok=True)
    os.makedirs(os.path.join(fe_dir, "components", "telemetry"), exist_ok=True)
    os.makedirs(os.path.join(fe_dir, "components", "diagnostics"), exist_ok=True)
    os.makedirs(os.path.join(fe_dir, "components", "navigation"), exist_ok=True)
    os.makedirs(os.path.join(fe_dir, "lib"), exist_ok=True)

    # 1. Dataset metadata
    with open(os.path.join(data_dir, "dataset_metadata.json"), "w") as f:
        json.dump({
            "total_samples": 10000,
            "train_samples": 6000,
            "val_samples": 2000,
            "test_samples": 2000
        }, f)

    # 2. Anomaly detector
    with open(os.path.join(artifacts_dir, "anomaly_detector_metrics.json"), "w") as f:
        json.dump({
            "recall": 0.7038,
            "f1": 0.8210,
            "false_positive_rate": 0.0425
        }, f)

    with open(os.path.join(artifacts_dir, "stage1_diagnosis.json"), "w") as f:
        json.dump({"overall_fpr": 0.0425}, f)

    # 3. Fault classifier
    with open(os.path.join(artifacts_dir, "fault_classifier_metrics.json"), "w") as f:
        json.dump({
            "accuracy": 0.9640,
            "f1_macro": 0.9639
        }, f)

    # 4. RUL metrics
    with open(os.path.join(artifacts_dir, "rul_metrics.json"), "w") as f:
        json.dump({
            "mae_hours": 0.7466,
            "rmse_hours": 1.1849
        }, f)

    # 5. Latency metrics
    with open(os.path.join(artifacts_dir, "latency_metrics.json"), "w") as f:
        json.dump({
            "benchmark_metadata": {
                "benchmark_windows_evaluated": 500,
                "warmup_windows": 50,
                "cpu_model": "Test CPU",
                "os": "Windows",
                "architecture": "x86_64",
                "python_version": "3.10.0"
            },
            "disk_sizes_kb": {},
            "latencies": {
                "stage_2_xgboost": {"mean_ms": 1.17, "p50_ms": 1.04, "p95_ms": 1.70},
                "full_production_pipeline": {"mean_ms": 32.80, "p50_ms": 31.87, "p95_ms": 38.00}
            }
        }, f)

    # 6. CWRU metrics
    with open(os.path.join(artifacts_dir, "real_data_cwru_metrics.json"), "w") as f:
        json.dump({
            "within_dataset_performance": {
                "accuracy": 0.70,
                "macro_f1": 0.3626
            }
        }, f)

    # 7. Model selection
    with open(os.path.join(artifacts_dir, "model_selection.json"), "w") as f:
        json.dump({
            "evaluation_partition": "VALIDATION (dataset_val.csv)",
            "algorithmic_criteria": {
                "test_set_access": "STRICTLY FORBIDDEN"
            },
            "metric_provenance": {
                "validation_dataset": "dataset_val.csv"
            },
            "stage_2_fault_classification": {
                "candidate_models": {
                    "XGBoost": {"validation_macro_f1": 0.9558},
                    "RandomForest": {"validation_macro_f1": 0.9500},
                    "SVM_RBF": {"validation_macro_f1": 0.9100},
                    "1D_CNN_Raw_Waveforms": {"validation_macro_f1": 0.7800}
                }
            }
        }, f)

    # 8. AI4I metrics
    with open(os.path.join(ai4i_dir, "ai4i_evaluation_metrics.json"), "w") as f:
        json.dump({
            "champion_model": "XGBoost Classifier",
            "model_comparison": {
                "XGBoost Classifier": {
                    "test_accuracy": 0.9845,
                    "test_f1_binary": 0.7862,
                    "test_f1_macro": 0.8891,
                    "confusion_matrix": [[1912, 20], [11, 57]]
                }
            }
        }, f)

    # 9. Model quality & robustness
    with open(os.path.join(artifacts_dir, "model_quality_checks.json"), "w") as f:
        json.dump({}, f)
    with open(os.path.join(artifacts_dir, "robustness_metrics.json"), "w") as f:
        json.dump({}, f)

    # 10. Documentation: paper_numbers.md
    with open(os.path.join(docs_dir, "paper_numbers.md"), "w") as f:
        f.write("""# Paper Numbers
- 500 timed windows
- Stage 2 Accuracy: 96.40%
- Stage 2 Macro F1: 0.9639
- Stage 1 Recall: 70.38%
- Stage 1 F1: 0.8210
- Stage 3 RUL MAE: 0.7466 hrs
- Stage 3 RUL RMSE: 1.1849 hrs
- Complete End-to-End Decision Pipeline: 32.80 ms
- CWRU Test Accuracy: 70.00%
- CWRU Macro F1: 0.3626
- AI4I Test Accuracy: 98.45%
- AI4I Binary F1: 0.7862
- 6,000 windows train
- 2,000 windows test
""")

    # 11. Reports
    with open(os.path.join(reports_dir, "MACHINA_X_Experimental_Results.md"), "w") as f:
        f.write("""# Experimental Results
Stage 2 Accuracy: 96.40%
Stage 1 Recall: 70.38%
Stage 3 RUL MAE: 0.7466
Full Pipeline Latency: 32.80 ms
""" + ("A" * 6000))

    with open(os.path.join(reports_dir, "MACHINA_X_Experimental_Results.docx"), "wb") as f:
        f.write(b"PK" + (b"\x00" * 15000))
    with open(os.path.join(reports_dir, "MACHINA_X_Experimental_Results.pdf"), "wb") as f:
        f.write(b"%PDF-" + (b"\x00" * 60000))
    with open(os.path.join(reports_dir, "MACHINA_X_Presentation_Study_Guide.pdf"), "wb") as f:
        f.write(b"%PDF-" + (b"\x00" * 60000))

    # 12. Frontend modules
    fe_files = [
        "pages/OverviewPage.tsx", "pages/EquipmentMonitorPage.tsx", "pages/DiagnosticsPage.tsx",
        "pages/DataLabPage.tsx", "pages/ResearchPage.tsx", "pages/Monitor.tsx",
        "pages/CheckFile.tsx", "pages/About.tsx", "components/equipment/MotorSchematic.tsx",
        "components/telemetry/TelemetryChart.tsx", "components/diagnostics/TreeShapChart.tsx",
        "components/diagnostics/RulDegradationChart.tsx", "components/navigation/NavigationRail.tsx",
        "components/navigation/GlobalHeader.tsx", "lib/plain.ts", "App.tsx"
    ]
    for ff in fe_files:
        with open(os.path.join(fe_dir, ff), "w") as f:
            f.write("// clean component without forbidden literals\nexport const x = 1;\n")

    # 13. Model checkpoints
    checkpoints = [
        "anomaly_detector.joblib", "fault_classifier.joblib", "rul_lstm_model.pt",
        "rul_model_bundle.joblib", "rf_model.joblib", "svm_model.joblib"
    ]
    for cp in checkpoints:
        with open(os.path.join(artifacts_dir, cp), "wb") as f:
            f.write(b"MODEL" + (b"\x00" * 2000))

    return root


# =========================================================================
# Scenario 10: Valid Consistent Set Passes Cleanly
# =========================================================================
def test_verifier_passes_on_valid_workspace(clean_mock_workspace):
    res = run_integrity_verification(root_dir=clean_mock_workspace)
    assert res["success"] is True, f"Expected success but failed with: {res['failures']}"
    assert len(res["failures"]) == 0


# =========================================================================
# Scenario 1: Fails when Required Artifact is Missing
# =========================================================================
def test_verifier_fails_when_artifact_missing(clean_mock_workspace):
    missing_file = os.path.join(clean_mock_workspace, "ml", "artifacts", "fault_classifier_metrics.json")
    os.remove(missing_file)
    res = run_integrity_verification(root_dir=clean_mock_workspace)
    assert res["success"] is False
    assert any("Missing required source artifact" in f for f in res["failures"])


# =========================================================================
# Scenario 2: Fails when JSON is Malformed
# =========================================================================
def test_verifier_fails_when_json_malformed(clean_mock_workspace):
    corrupt_file = os.path.join(clean_mock_workspace, "ml", "artifacts", "fault_classifier_metrics.json")
    with open(corrupt_file, "w") as f:
        f.write("{ invalid_json: true, unterminated ...")
    res = run_integrity_verification(root_dir=clean_mock_workspace)
    assert res["success"] is False
    assert any("Malformed JSON" in f for f in res["failures"])


# =========================================================================
# Scenario 3: Fails when Canonical Metric Differs from Generated Report
# =========================================================================
def test_verifier_fails_when_metric_differs_from_report(clean_mock_workspace):
    doc_file = os.path.join(clean_mock_workspace, "docs", "paper_numbers.md")
    with open(doc_file, "w") as f:
        f.write("Stage 2 Accuracy: 55.00%\nStage 2 Macro F1: 0.5000\n")
    res = run_integrity_verification(root_dir=clean_mock_workspace)
    assert res["success"] is False
    assert any("Documentation matches Stage 2 Accuracy" in f for f in res["failures"])


# =========================================================================
# Scenario 4: Fails when Wrong Metric is Labeled as Full-Pipeline Latency
# =========================================================================
def test_verifier_fails_when_wrong_metric_labeled_as_full_pipeline_latency(clean_mock_workspace):
    lat_file = os.path.join(clean_mock_workspace, "ml", "artifacts", "latency_metrics.json")
    with open(lat_file, "r") as f:
        d = json.load(f)
    # Put 3.25 ms as full_production_pipeline
    d["latencies"]["full_production_pipeline"]["mean_ms"] = 3.25
    with open(lat_file, "w") as f:
        json.dump(d, f)
    res = run_integrity_verification(root_dir=clean_mock_workspace)
    assert res["success"] is False
    assert any("Full pipeline latency reflects end-to-end workload >= 25ms" in f for f in res["failures"])


# =========================================================================
# Scenario 5: Fails when AI4I Macro F1 is Incorrectly Labeled as Binary F1
# =========================================================================
def test_verifier_fails_when_ai4i_f1_inconsistent(clean_mock_workspace):
    ai4i_file = os.path.join(clean_mock_workspace, "ml", "artifacts", "ai4i", "ai4i_evaluation_metrics.json")
    with open(ai4i_file, "r") as f:
        d = json.load(f)
    # Corrupt binary F1 to 0.8891 (confusing macro F1 with binary F1)
    d["model_comparison"]["XGBoost Classifier"]["test_f1_binary"] = 0.8891
    with open(ai4i_file, "w") as f:
        json.dump(d, f)
    res = run_integrity_verification(root_dir=clean_mock_workspace)
    assert res["success"] is False
    assert any("failure-class binary F1 matches canonical 0.7862" in f for f in res["failures"])


# =========================================================================
# Scenario 6: Fails when Stale Report Remains After Artifact Changes
# =========================================================================
def test_verifier_fails_when_report_is_stale(clean_mock_workspace):
    # Change classifier accuracy in artifact to 97.50%, leaving doc at 96.40%
    fc_file = os.path.join(clean_mock_workspace, "ml", "artifacts", "fault_classifier_metrics.json")
    with open(fc_file, "w") as f:
        json.dump({"accuracy": 0.9750, "f1_macro": 0.9750}, f)
    res = run_integrity_verification(root_dir=clean_mock_workspace)
    assert res["success"] is False
    assert any("Documentation matches Stage 2 Accuracy: 97.50%" in f for f in res["failures"])


# =========================================================================
# Scenario 7: Fails when Forbidden Hardcoded Literals Appear in Frontend
# =========================================================================
def test_verifier_fails_when_forbidden_literal_in_frontend(clean_mock_workspace):
    bad_comp = os.path.join(clean_mock_workspace, "frontend", "src", "pages", "OverviewPage.tsx")
    with open(bad_comp, "a") as f:
        f.write("const fakeNumber = 98.45;\n")
    res = run_integrity_verification(root_dir=clean_mock_workspace)
    assert res["success"] is False
    assert any("contains '98.45'" in f for f in res["failures"])


# =========================================================================
# Scenario 8: Fails when Stage 1 FPR Exceeds Maximum Invariant (5.0%)
# =========================================================================
def test_verifier_fails_when_threshold_fpr_exceeds_five_percent(clean_mock_workspace):
    ad_file = os.path.join(clean_mock_workspace, "ml", "artifacts", "anomaly_detector_metrics.json")
    with open(ad_file, "w") as f:
        json.dump({"recall": 0.7038, "f1": 0.8210, "false_positive_rate": 0.0850}, f)
    res = run_integrity_verification(root_dir=clean_mock_workspace)
    assert res["success"] is False
    assert any("Stage 1 False Positive Rate <= 5.0%" in f for f in res["failures"])


# =========================================================================
# Scenario 9: Fails when Report Contains Obsolete Headline Claims (e.g. 99.85%)
# =========================================================================
def test_verifier_fails_when_report_contains_obsolete_claim(clean_mock_workspace):
    doc_file = os.path.join(clean_mock_workspace, "docs", "paper_numbers.md")
    with open(doc_file, "a") as f:
        f.write("\nObsolete claim: UCI AI4I Accuracy = 99.85%\n")
    res = run_integrity_verification(root_dir=clean_mock_workspace)
    assert res["success"] is False
    assert any("does NOT contain unverified 99.85% AI4I claim" in f for f in res["failures"])
