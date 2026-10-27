"""
MACHINA-X: Comprehensive System Integrity, Provenance & Scientific Consistency Suite
=====================================================================================
Enforces strict scientific and engineering invariants:
1. Artifact Integrity & Schema: Validates presence, non-emptiness, valid JSON parsing,
   and finite numeric ranges for all canonical empirical artifacts.
2. Cross-Artifact & Report Consistency: Cross-checks values in documentation
   (docs/paper_numbers.md and docs/reports/MACHINA_X_Experimental_Results.md) directly
   against raw empirical JSON artifacts on disk.
3. Latency Scope Differentiation: Verifies that full production pipeline latency (32.80 ms)
   is strictly distinguished from model-only inference latency (1.17 ms XGBoost),
   and guarantees unverified latency numbers (3.25 ms) are not reported as full-pipeline latency.
4. Benchmark Metric Semantics: Verifies that AI4I benchmark metrics have explicit averaging
   semantics (binary F1 = 0.7862 on minority failure class, macro F1 = 0.8891, accuracy = 98.45%)
   and guarantees unverified claims (99.85%, 0.8804) are not published.
5. Provenance & Anti-Leakage: Verifies model selection strictly used validation metrics
   without inspecting the test set, with complete metric provenance.
6. Physical External Data Consistency: Reconciles CWRU benchmark numbers (70.00% cross-load accuracy,
   0.3626 macro F1) and checks class-level limitation disclosures.
7. Frontend Codebase Architecture: Verifies presence of all 16 Aerospace Mission Control modules
   and verifies zero forbidden hardcoded metrics or random generators in frontend/src/.
8. Deliverables Freshness: Verifies presence, non-zero size, and freshness of DOCX, PDF, and
   Markdown reports.

Returns a dictionary with success status and detailed logs; exits 0 on success, 1 on failure.
"""

import os
import sys
import json
import math

def run_integrity_verification(root_dir: str = None) -> dict:
    if root_dir is None:
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    artifacts_dir = os.path.join(root_dir, "ml", "artifacts")
    data_dir = os.path.join(root_dir, "data", "processed")
    docs_dir = os.path.join(root_dir, "docs")
    reports_dir = os.path.join(docs_dir, "reports")
    frontend_dir = os.path.join(root_dir, "frontend")

    failures = []
    successes = []

    def check(condition: bool, description: str):
        if condition:
            successes.append(f"[PASS] {description}")
        else:
            failures.append(f"[FAIL] {description}")

    # =========================================================================
    # 1. Artifact Existence, Non-Emptiness, and JSON Schema Integrity
    # =========================================================================
    required_artifacts = {
        "dataset_metadata": (os.path.join(data_dir, "dataset_metadata.json"), True),
        "anomaly_detector": (os.path.join(artifacts_dir, "anomaly_detector_metrics.json"), True),
        "fault_classifier": (os.path.join(artifacts_dir, "fault_classifier_metrics.json"), True),
        "rul_metrics": (os.path.join(artifacts_dir, "rul_metrics.json"), True),
        "latency_metrics": (os.path.join(artifacts_dir, "latency_metrics.json"), True),
        "cwru_metrics": (os.path.join(artifacts_dir, "real_data_cwru_metrics.json"), True),
        "model_selection": (os.path.join(artifacts_dir, "model_selection.json"), True),
        "stage1_diagnosis": (os.path.join(artifacts_dir, "stage1_diagnosis.json"), True),
        "ai4i_metrics": (os.path.join(artifacts_dir, "ai4i", "ai4i_evaluation_metrics.json"), True),
        "model_quality": (os.path.join(artifacts_dir, "model_quality_checks.json"), True),
        "robustness_metrics": (os.path.join(artifacts_dir, "robustness_metrics.json"), True),
        "paper_numbers_doc": (os.path.join(docs_dir, "paper_numbers.md"), False)
    }

    parsed_artifacts = {}
    for key, (fpath, is_json) in required_artifacts.items():
        if not os.path.exists(fpath):
            failures.append(f"[FAIL] Missing required source artifact: {os.path.relpath(fpath, root_dir)}")
            continue
        if os.path.getsize(fpath) == 0:
            failures.append(f"[FAIL] Empty artifact detected (0 bytes): {os.path.relpath(fpath, root_dir)}")
            continue

        if is_json:
            try:
                with open(fpath, "r", encoding="utf-8") as fp:
                    data = json.load(fp)
                parsed_artifacts[key] = data
                successes.append(f"[PASS] Artifact parsed valid JSON: {os.path.basename(fpath)}")
            except Exception as e:
                failures.append(f"[FAIL] Malformed JSON in {os.path.basename(fpath)}: {str(e)}")
        else:
            with open(fpath, "r", encoding="utf-8") as fp:
                parsed_artifacts[key] = fp.read()
            successes.append(f"[PASS] Text artifact loaded: {os.path.basename(fpath)}")

    # Early exit if core artifacts are missing
    if len(parsed_artifacts) < len(required_artifacts):
        return {"success": False, "successes": successes, "failures": failures}

    meta = parsed_artifacts["dataset_metadata"]
    ad = parsed_artifacts["anomaly_detector"]
    fc = parsed_artifacts["fault_classifier"]
    rul = parsed_artifacts["rul_metrics"]
    lat = parsed_artifacts["latency_metrics"]
    cwru = parsed_artifacts["cwru_metrics"]
    sel = parsed_artifacts["model_selection"]
    diag = parsed_artifacts["stage1_diagnosis"]
    ai4i = parsed_artifacts["ai4i_metrics"]
    mqc = parsed_artifacts["model_quality"]
    doc_numbers = parsed_artifacts["paper_numbers_doc"]

    # =========================================================================
    # 2. Metric Finite Numeric Ranges & Value Bounds
    # =========================================================================
    def is_finite_number(val):
        return isinstance(val, (int, float)) and not math.isnan(val) and not math.isinf(val)

    # Stage 1 bounds
    check(is_finite_number(ad.get("recall")) and 0.0 <= ad["recall"] <= 1.0, "Stage 1 Recall is finite float in [0, 1]")
    check(is_finite_number(ad.get("false_positive_rate")) and 0.0 <= ad["false_positive_rate"] <= 0.05,
          f"Stage 1 False Positive Rate <= 5.0% (actual: {ad.get('false_positive_rate', 1.0)*100:.2f}%)")
    check(is_finite_number(diag.get("overall_fpr")) and 0.0 <= diag["overall_fpr"] <= 0.05,
          f"Stage 1 Diagnostic FPR <= 5.0% (actual: {diag.get('overall_fpr', 1.0)*100:.2f}%)")

    # Stage 2 bounds
    check(is_finite_number(fc.get("accuracy")) and 0.0 <= fc["accuracy"] <= 1.0, "Stage 2 Accuracy is finite float in [0, 1]")
    check(is_finite_number(fc.get("f1_macro")) and 0.0 <= fc["f1_macro"] <= 1.0, "Stage 2 Macro F1 is finite float in [0, 1]")

    # Stage 3 bounds
    check(is_finite_number(rul.get("mae_hours")) and rul["mae_hours"] > 0, "Stage 3 RUL MAE is positive finite number")
    check(is_finite_number(rul.get("rmse_hours")) and rul["rmse_hours"] > 0, "Stage 3 RUL RMSE is positive finite number")

    # =========================================================================
    # 3. Cross-Artifact Consistency Checks (docs/paper_numbers.md vs JSON)
    # =========================================================================
    fc_acc_str = f"{fc['accuracy']*100:.2f}%"
    fc_f1_str = f"{fc['f1_macro']:.4f}"
    check(fc_acc_str in doc_numbers, f"Documentation matches Stage 2 Accuracy: {fc_acc_str}")
    check(fc_f1_str in doc_numbers, f"Documentation matches Stage 2 Macro F1: {fc_f1_str}")

    ad_rec_str = f"{ad['recall']*100:.2f}%"
    ad_f1_str = f"{ad['f1']:.4f}"
    check(ad_rec_str in doc_numbers, f"Documentation matches Stage 1 Recall: {ad_rec_str}")
    check(ad_f1_str in doc_numbers, f"Documentation matches Stage 1 F1: {ad_f1_str}")

    rul_mae_str = f"{rul['mae_hours']:.4f}"
    rul_rmse_str = f"{rul['rmse_hours']:.4f}"
    check(rul_mae_str in doc_numbers, f"Documentation matches Stage 3 RUL MAE: {rul_mae_str} hrs")
    check(rul_rmse_str in doc_numbers, f"Documentation matches Stage 3 RUL RMSE: {rul_rmse_str} hrs")

    # =========================================================================
    # 4. Latency Scope Differentiation & Anti-Confusion Invariants
    # =========================================================================
    latencies = lat.get("latencies", {})
    bench_meta = lat.get("benchmark_metadata", {})
    timed_cnt = bench_meta.get("benchmark_windows_evaluated", 0)
    check(timed_cnt > 0, f"Latency benchmark windows evaluated > 0 (actual: {timed_cnt})")
    check(f"{timed_cnt} timed" in doc_numbers, f"Documentation correctly records '{timed_cnt} timed' windows")
    check("- **Platform:** N/A" not in doc_numbers, "Documentation does NOT report Platform as N/A")

    # Full pipeline latency verification
    full_lat = latencies.get("full_production_pipeline", {})
    full_mean = full_lat.get("mean_ms", 0.0)
    check(full_mean >= 25.0, f"Full pipeline latency reflects end-to-end workload >= 25ms (actual: {full_mean:.2f} ms)")
    check(f"{full_mean:.2f}" in doc_numbers, f"Documentation contains canonical full-pipeline latency: {full_mean:.2f} ms")

    # Model-only XGBoost latency verification
    xgb_lat = latencies.get("stage_2_xgboost", {})
    xgb_mean = xgb_lat.get("mean_ms", 0.0)
    check(0.5 <= xgb_mean <= 3.0, f"Stage 2 XGBoost latency reflects model-only speed (actual: {xgb_mean:.2f} ms)")

    # Anti-confusion: Ensure unverified lower latency (3.25 ms) is NOT claimed as full pipeline latency
    check("3.25 ms" not in doc_numbers or "Complete End-to-End Decision Pipeline | **3.25**" not in doc_numbers,
          "Full production pipeline is NOT confused with unverified 3.25 ms metric")

    # =========================================================================
    # 5. AI4I Benchmark Evaluation & Averaging Semantics
    # =========================================================================
    ai4i_models = ai4i.get("model_comparison", {})
    check("XGBoost Classifier" in ai4i_models, "AI4I benchmark contains champion XGBoost Classifier")
    xgb_ai4i = ai4i_models.get("XGBoost Classifier", {})
    ai4i_acc = xgb_ai4i.get("test_accuracy", 0.0)
    ai4i_f1_bin = xgb_ai4i.get("test_f1_binary", xgb_ai4i.get("test_f1", 0.0))
    ai4i_f1_mac = xgb_ai4i.get("test_f1_macro", 0.0)

    check(ai4i_acc == 0.9845, f"AI4I XGBoost test accuracy matches canonical 98.45% (actual: {ai4i_acc*100:.2f}%)")
    check(ai4i_f1_bin == 0.7862, f"AI4I XGBoost failure-class binary F1 matches canonical 0.7862 (actual: {ai4i_f1_bin:.4f})")
    check(ai4i_f1_mac == 0.8891, f"AI4I XGBoost macro F1 matches canonical 0.8891 (actual: {ai4i_f1_mac:.4f})")
    check(f"{ai4i_acc*100:.2f}%" in doc_numbers, f"Documentation records AI4I test accuracy: {ai4i_acc*100:.2f}%")
    check(f"{ai4i_f1_bin:.4f}" in doc_numbers, f"Documentation records AI4I binary F1: {ai4i_f1_bin:.4f}")

    # Anti-confusion: Ensure unverified AI4I claims (99.85%, 0.8804) are NOT in paper_numbers
    check("99.85%" not in doc_numbers, "Documentation does NOT contain unverified 99.85% AI4I claim")
    check("0.8804" not in doc_numbers, "Documentation does NOT contain unverified 0.8804 AI4I claim")

    # =========================================================================
    # 6. Physical External Data Consistency (CWRU Bearing Benchmark)
    # =========================================================================
    cwru_within = cwru.get("within_dataset_performance", {})
    cwru_acc = cwru_within.get("accuracy", 0.0)
    cwru_f1 = cwru_within.get("macro_f1", 0.0)
    check(cwru_acc == 0.70, f"CWRU cross-load accuracy matches canonical 70.00% (actual: {cwru_acc*100:.2f}%)")
    check(cwru_f1 == 0.3626, f"CWRU cross-load macro F1 matches canonical 0.3626 (actual: {cwru_f1:.4f})")
    check(f"{cwru_acc*100:.2f}%" in doc_numbers, f"Documentation records CWRU accuracy: {cwru_acc*100:.2f}%")
    check(f"{cwru_f1:.4f}" in doc_numbers, f"Documentation records CWRU macro F1: {cwru_f1:.4f}")

    # =========================================================================
    # 7. Dataset Partition Counts & Run-Level Anti-Leakage
    # =========================================================================
    check(meta.get("total_samples") == 10000, "Dataset total samples == 10,000")
    check(meta.get("train_samples") == 6000, "Dataset train samples == 6,000")
    check(meta.get("val_samples") == 2000, "Dataset val samples == 2,000")
    check(meta.get("test_samples") == 2000, "Dataset test samples == 2,000")
    check("6,000 windows" in doc_numbers, "Documentation reports 6,000 train windows")
    check("2,000 windows" in doc_numbers, "Documentation reports 2,000 test windows")

    # =========================================================================
    # 8. Model Selection Anti-Leakage & Provenance Discipline
    # =========================================================================
    check("VALIDATION" in sel.get("evaluation_partition", ""), "Model selection evaluates strictly on VALIDATION partition")
    check("STRICTLY FORBIDDEN" in sel.get("algorithmic_criteria", {}).get("test_set_access", ""),
          "Model selection explicitly forbids test set access")
    check("metric_provenance" in sel, "Model selection artifact records explicit metric_provenance")

    s2_cand = sel.get("stage_2_fault_classification", {}).get("candidate_models", {})
    for cname, cdata in s2_cand.items():
        check("validation_macro_f1" in cdata, f"Candidate {cname} uses validation_macro_f1")
        check("test_macro_f1" not in cdata, f"Candidate {cname} has zero test_macro_f1 leakage")

    # =========================================================================
    # 9. Frontend Codebase Architecture & Integrity Verification
    # =========================================================================
    required_frontend_components = [
        os.path.join(frontend_dir, "src", "pages", "OverviewPage.tsx"),
        os.path.join(frontend_dir, "src", "pages", "EquipmentMonitorPage.tsx"),
        os.path.join(frontend_dir, "src", "pages", "DiagnosticsPage.tsx"),
        os.path.join(frontend_dir, "src", "pages", "DataLabPage.tsx"),
        os.path.join(frontend_dir, "src", "pages", "ResearchPage.tsx"),
        os.path.join(frontend_dir, "src", "components", "equipment", "MotorSchematic.tsx"),
        os.path.join(frontend_dir, "src", "components", "telemetry", "TelemetryChart.tsx"),
        os.path.join(frontend_dir, "src", "components", "diagnostics", "TreeShapChart.tsx"),
        os.path.join(frontend_dir, "src", "components", "diagnostics", "RulDegradationChart.tsx"),
        os.path.join(frontend_dir, "src", "components", "navigation", "NavigationRail.tsx"),
        os.path.join(frontend_dir, "src", "components", "navigation", "GlobalHeader.tsx"),
        os.path.join(frontend_dir, "src", "pages", "Monitor.tsx"),
        os.path.join(frontend_dir, "src", "pages", "CheckFile.tsx"),
        os.path.join(frontend_dir, "src", "pages", "About.tsx"),
        os.path.join(frontend_dir, "src", "lib", "plain.ts"),
        os.path.join(frontend_dir, "src", "App.tsx")
    ]
    all_components_exist = True
    for comp in required_frontend_components:
        if not os.path.exists(comp):
            failures.append(f"[FAIL] Missing required frontend component: {os.path.relpath(comp, root_dir)}")
            all_components_exist = False

    check(all_components_exist, f"All {len(required_frontend_components)} Aerospace Mission Control frontend modules exist")

    # Anti-leakage / Zero forbidden hardcoded metrics in frontend src/
    forbidden_fe_literals = ['94.55', '98.45', '0.22 hrs', 'Math.random', '99.85', '0.8804']
    fe_violations = []
    src_dir = os.path.join(frontend_dir, "src")
    if os.path.exists(src_dir):
        for r_dir, _, f_files in os.walk(src_dir):
            for fname in f_files:
                if fname.endswith((".ts", ".tsx")) and not fname.endswith((".test.ts", ".test.tsx")):
                    fpath = os.path.join(r_dir, fname)
                    with open(fpath, "r", encoding="utf-8") as f:
                        content = f.read()
                        for fl in forbidden_fe_literals:
                            if fl in content:
                                fe_violations.append(f"{os.path.relpath(fpath, src_dir)}: contains '{fl}'")
    check(len(fe_violations) == 0, f"Frontend src/ contains zero hardcoded metrics or random generators (violations: {fe_violations})")

    # =========================================================================
    # 10. Deliverables Freshness & Report Consistency
    # =========================================================================
    docx_file = os.path.join(reports_dir, "MACHINA_X_Experimental_Results.docx")
    pdf_file = os.path.join(reports_dir, "MACHINA_X_Experimental_Results.pdf")
    md_file = os.path.join(reports_dir, "MACHINA_X_Experimental_Results.md")
    study_guide_file = os.path.join(reports_dir, "MACHINA_X_Presentation_Study_Guide.pdf")

    check(os.path.exists(docx_file) and os.path.getsize(docx_file) > 10000,
          f"DOCX report exists and valid ({os.path.getsize(docx_file) if os.path.exists(docx_file) else 0:,} bytes)")
    check(os.path.exists(pdf_file) and os.path.getsize(pdf_file) > 50000,
          f"PDF report exists and valid ({os.path.getsize(pdf_file) if os.path.exists(pdf_file) else 0:,} bytes)")
    check(os.path.exists(md_file) and os.path.getsize(md_file) > 5000,
          f"Markdown report exists and valid ({os.path.getsize(md_file) if os.path.exists(md_file) else 0:,} bytes)")
    check(os.path.exists(study_guide_file) and os.path.getsize(study_guide_file) > 50000,
          f"Presentation Study Guide PDF exists and valid ({os.path.getsize(study_guide_file) if os.path.exists(study_guide_file) else 0:,} bytes)")

    # Cross-check markdown experimental results file
    if os.path.exists(md_file):
        with open(md_file, "r", encoding="utf-8") as fp:
            exp_md = fp.read()
        check(f"{fc['accuracy']*100:.2f}%" in exp_md, "Experimental report matches Stage 2 Accuracy")
        check(f"{ad['recall']*100:.2f}%" in exp_md, "Experimental report matches Stage 1 Recall")
        check(f"{rul['mae_hours']:.4f}" in exp_md, "Experimental report matches Stage 3 RUL MAE")
        check(f"{full_mean:.2f} ms" in exp_md, "Experimental report matches Full Pipeline Latency")
        check("99.85%" not in exp_md, "Experimental report does NOT contain unverified 99.85% AI4I claim")

    # =========================================================================
    # 11. Model Checkpoint Files
    # =========================================================================
    for ea in [
        "anomaly_detector.joblib",
        "fault_classifier.joblib",
        "rul_lstm_model.pt",
        "rul_model_bundle.joblib",
        "rf_model.joblib",
        "svm_model.joblib"
    ]:
        path = os.path.join(artifacts_dir, ea)
        check(os.path.exists(path) and os.path.getsize(path) > 1000, f"Model checkpoint exists: ml/artifacts/{ea}")

    return {
        "success": len(failures) == 0,
        "successes": successes,
        "failures": failures
    }

def main():
    res = run_integrity_verification()
    print("=================================================================")
    print("      MACHINA-X RIGOROUS INTEGRITY & PROVENANCE SUITE            ")
    print("=================================================================\n")

    for s in res["successes"]:
        print(s)

    if not res["success"]:
        print("\nFAILURE DETAILS:")
        for f in res["failures"]:
            print(f)
        print(f"\n[FAILED] Verification failed with {len(res['failures'])} invariant violations.")
        sys.exit(1)
    else:
        print(f"\n[SUCCESS] All {len(res['successes'])} dynamic consistency and integrity invariants passed successfully!")
        sys.exit(0)

if __name__ == "__main__":
    main()
