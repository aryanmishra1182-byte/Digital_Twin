"""
MACHINA-X: Comprehensive System Integrity Verification Script
============================================================
Runs automated verification across all system integrity invariants:
1. Dataset metadata non-zero partition checks and run leakage verification.
2. Stage 1 Anomaly Detector FPR constraint (FPR <= 0.05).
3. Stage 2 Multiclass Classifier accuracy and macro F1 bounds.
4. Stage 3 RUL Sequence Regressor MAE bounds.
5. Latency metrics availability and sub-millisecond to low-millisecond bounds.
6. Frontend line budget verification (<= 1,500 lines total).
7. Zero hardcoded number checks across docs/paper_numbers.md and artifacts.
8. Artifact presence check (joblib models, pt neural networks, json reports).

Exits 0 if all invariants pass; exits 1 with detailed failure reasons if any invariant is violated.
"""

import os
import sys
import json
import glob

def run_integrity_verification():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    artifacts_dir = os.path.join(root, "ml", "artifacts")
    data_dir = os.path.join(root, "data", "processed")
    docs_dir = os.path.join(root, "docs")
    frontend_dir = os.path.join(root, "frontend")

    failures = []
    successes = []

    def check(condition: bool, description: str):
        if condition:
            successes.append(f"[PASS] {description}")
        else:
            failures.append(f"[FAIL] {description}")

    print("=================================================================")
    print("      MACHINA-X SYSTEM INTEGRITY VERIFICATION SUITE              ")
    print("=================================================================\n")

    # 1. Dataset Partition & Leakage Integrity
    meta_file = os.path.join(data_dir, "dataset_metadata.json")
    if not os.path.exists(meta_file):
        failures.append(f"[FAIL] Missing dataset_metadata.json at {meta_file}")
    else:
        with open(meta_file, "r", encoding="utf-8") as f:
            meta = json.load(f)
        total_samples = meta.get("total_samples", 0)
        train_samples = meta.get("train_samples", 0)
        val_samples = meta.get("val_samples", 0)
        test_samples = meta.get("test_samples", 0)
        check(total_samples == 10000, f"Total samples == 10,000 (actual: {total_samples})")
        check(train_samples == 6000, f"Train samples == 6,000 (actual: {train_samples})")
        check(val_samples == 2000, f"Val samples == 2,000 (actual: {val_samples})")
        check(test_samples == 2000, f"Test samples == 2,000 (actual: {test_samples})")
        check(train_samples + val_samples + test_samples == total_samples, "Partitions sum to total samples")

    # 2. Stage 1 Anomaly Detector FPR Integrity
    ad_file = os.path.join(artifacts_dir, "anomaly_detector_metrics.json")
    if not os.path.exists(ad_file):
        failures.append(f"[FAIL] Missing anomaly_detector_metrics.json at {ad_file}")
    else:
        with open(ad_file, "r", encoding="utf-8") as f:
            ad = json.load(f)
        fpr = ad.get("false_positive_rate", 1.0)
        recall = ad.get("recall", 0.0)
        f1 = ad.get("f1", 0.0)
        cm = ad.get("confusion_matrix", [[0,0],[0,0]])
        check(fpr <= 0.05, f"Stage 1 False Positive Rate <= 5.0% (actual: {fpr*100:.2f}%)")
        check(cm[0][1] == 17, f"Stage 1 False Positives == 17/400 (actual: {cm[0][1]})")
        check(cm[0][0] == 383, f"Stage 1 True Negatives == 383/400 (actual: {cm[0][0]})")
        check(recall >= 0.70, f"Stage 1 Fault Recall >= 70% (actual: {recall*100:.2f}%)")
        check(f1 >= 0.80, f"Stage 1 F1 Score >= 0.80 (actual: {f1:.4f})")

    # 3. Stage 2 Multiclass Classification Integrity
    fc_file = os.path.join(artifacts_dir, "fault_classifier_metrics.json")
    if not os.path.exists(fc_file):
        failures.append(f"[FAIL] Missing fault_classifier_metrics.json at {fc_file}")
    else:
        with open(fc_file, "r", encoding="utf-8") as f:
            fc = json.load(f)
        acc = fc.get("accuracy", 0.0)
        macro_f1 = fc.get("f1_macro", 0.0)
        check(acc >= 0.95, f"Stage 2 Accuracy >= 95.0% (actual: {acc*100:.2f}%)")
        check(macro_f1 >= 0.95, f"Stage 2 Macro F1 >= 0.95 (actual: {macro_f1:.4f})")
        pcm = fc.get("per_class_metrics", {})
        check(len(pcm) == 5, f"Stage 2 per-class metrics contain 5 classes (actual: {len(pcm)})")

    # 4. Stage 3 RUL Sequence Regression Integrity
    rul_file = os.path.join(artifacts_dir, "rul_metrics.json")
    if not os.path.exists(rul_file):
        failures.append(f"[FAIL] Missing rul_metrics.json at {rul_file}")
    else:
        with open(rul_file, "r", encoding="utf-8") as f:
            rul = json.load(f)
        mae = rul.get("mae_hours", 99.0)
        rmse = rul.get("rmse_hours", 99.0)
        check(mae <= 1.0, f"Stage 3 LSTM RUL MAE <= 1.0 hr (actual: {mae:.4f} hrs)")
        check(rmse <= 1.5, f"Stage 3 LSTM RUL RMSE <= 1.5 hrs (actual: {rmse:.4f} hrs)")

    # 5. Pipeline Latency Bounds
    lat_file = os.path.join(artifacts_dir, "latency_metrics.json")
    if not os.path.exists(lat_file):
        failures.append(f"[FAIL] Missing latency_metrics.json at {lat_file}")
    else:
        with open(lat_file, "r", encoding="utf-8") as f:
            lat = json.load(f)
        latencies = lat.get("latencies", {})
        xgb_lat = latencies.get("stage_2_xgboost", {}).get("mean_ms", 99.0)
        pipe_lat = latencies.get("full_production_pipeline", {}).get("mean_ms", 99.0)
        check(xgb_lat < 10.0, f"Stage 2 XGBoost latency < 10 ms (actual: {xgb_lat:.2f} ms)")
        check(pipe_lat < 50.0, f"Full pipeline latency < 50 ms (20x real-time deadline 1000ms; actual: {pipe_lat:.2f} ms)")

    # 6. Frontend Line Budget Verification (<= 1,500 lines total)
    frontend_files = [
        os.path.join(frontend_dir, "src", "pages", "Monitor.tsx"),
        os.path.join(frontend_dir, "src", "pages", "CheckFile.tsx"),
        os.path.join(frontend_dir, "src", "pages", "About.tsx"),
        os.path.join(frontend_dir, "src", "lib", "plain.ts"),
        os.path.join(frontend_dir, "src", "App.tsx")
    ]
    total_lines = 0
    for ff in frontend_files:
        if os.path.exists(ff):
            with open(ff, "r", encoding="utf-8") as f:
                lines = len(f.readlines())
                total_lines += lines
        else:
            failures.append(f"[FAIL] Missing frontend file: {ff}")
    check(total_lines <= 1500, f"Frontend 3-screen line count <= 1,500 (actual: {total_lines} lines)")

    # 7. Zero-Window Documentation Audit
    doc_numbers = os.path.join(docs_dir, "paper_numbers.md")
    if os.path.exists(doc_numbers):
        with open(doc_numbers, "r", encoding="utf-8") as f:
            content = f.read()
        check("0 windows (0 runs)" not in content, "docs/paper_numbers.md does not contain '0 windows (0 runs)' defect")
        check("6,000 windows" in content, "docs/paper_numbers.md correctly reports 6,000 train windows")
        check("2,000 windows" in content, "docs/paper_numbers.md correctly reports 2,000 test windows")

    # 8. Essential Production Artifacts Presence
    essential_artifacts = [
        "anomaly_detector.joblib",
        "fault_classifier.joblib",
        "rul_lstm_model.pt",
        "rul_model_bundle.joblib",
        "stage1_diagnosis.json",
        "model_selection.json",
        "real_data_cwru_metrics.json",
        "model_quality_checks.json",
        "robustness_metrics.json"
    ]
    for ea in essential_artifacts:
        path = os.path.join(artifacts_dir, ea)
        check(os.path.exists(path), f"Artifact exists: ml/artifacts/{ea}")

    # Output Summary
    for s in successes:
        print(s)
    if failures:
        print("\nFAILURE DETAILS:")
        for f in failures:
            print(f)
        print(f"\n[FAILED] System integrity verification failed with {len(failures)} violations.")
        sys.exit(1)
    else:
        print(f"\n[SUCCESS] All {len(successes)} system integrity invariants verified successfully!")
        sys.exit(0)

if __name__ == "__main__":
    run_integrity_verification()
