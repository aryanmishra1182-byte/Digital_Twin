"""
Benchmark Latency Script for MACHINA-X Pipeline
===============================================
Measures inference latency of:
1. Feature extraction (26 physics-guided features from 1-second raw windows)
2. Stage 1 Anomaly Detection (Isolation Forest)
3. Stage 2 Fault Classification (XGBoost)
4. Stage 4 SHAP Feature Attribution (TreeExplainer)
5. Full Path (Feature extraction -> Anomaly -> Classification -> SHAP)

Measures over at least 500 windows after a 50-window warm-up.
Outputs mean, p50 (median), p95, and p99 in milliseconds.
Saves to ml/artifacts/latency_metrics.json.
"""

import os
import sys
import time
import json
import platform
import numpy as np

# Ensure root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from simulator.motor_simulator import MotorSimulator
from ml.features.feature_extractor import FeatureExtractor, FEATURE_NAMES
import joblib
from ml.explainability.shap_explainer import MotorShapExplainer

def get_cpu_info():
    """Retrieve processor description across platforms."""
    try:
        if platform.system() == "Windows":
            import winreg
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"HARDWARE\DESCRIPTION\System\CentralProcessor\0")
            cpu_name = winreg.QueryValueEx(key, "ProcessorNameString")[0].strip()
            return cpu_name
        elif platform.system() == "Linux":
            with open("/proc/cpuinfo") as f:
                for line in f:
                    if "model name" in line:
                        return line.split(":")[1].strip()
        elif platform.system() == "Darwin":
            import subprocess
            return subprocess.check_output(["sysctl", "-n", "machdep.cpu.brand_string"]).decode().strip()
    except Exception:
        pass
    return platform.processor() or "Unknown CPU"

def main():
    print("[1/5] Initializing models and feature extractor...")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    artifacts_dir = os.path.join(base_dir, "ml", "artifacts")

    iso_path = os.path.join(artifacts_dir, "anomaly_detector.joblib")
    clf_path = os.path.join(artifacts_dir, "fault_classifier.joblib")

    anomaly_bundle = joblib.load(iso_path)
    classifier_bundle = joblib.load(clf_path)
    shap_explainer = MotorShapExplainer(clf_path)
    extractor = FeatureExtractor()

    # Pre-generate 550 synthetic 1-second raw signal windows
    print("[2/5] Synthesizing 550 raw signal windows for benchmarking...")
    sim = MotorSimulator(seed=123)
    windows = []
    faults = ["HEALTHY", "BROKEN_ROTOR_BAR", "STATOR_INTER_TURN_SHORT", "BEARING_DEFECT", "AIR_GAP_ECCENTRICITY"]
    for i in range(550):
        fc = faults[i % len(faults)]
        sev = 0.0 if fc == "HEALTHY" else 0.5
        w = sim.generate_window(
            run_id=f"BENCH_{i:04d}",
            load_pct=75.0,
            fault_class=fc,
            severity=sev,
            t_start=float(i)
        )
        windows.append(w)

    warmup_count = 50
    bench_count = 500
    total_samples = warmup_count + bench_count

    print(f"[3/5] Executing benchmark: {warmup_count} warmup windows + {bench_count} timed windows...")

    t_feat = []
    t_stage1 = []
    t_stage2 = []
    t_shap = []
    t_full = []

    for i in range(total_samples):
        w = windows[i]
        
        # Full path timing start
        t0 = time.perf_counter()

        # 1. Feature extraction
        tf0 = time.perf_counter()
        feat_dict = extractor.extract_features(
            current_signal=w.current_signal,
            vibration_signal=w.vibration_signal,
            temperature_c=w.temperature_c,
            prev_temperature_c=w.prev_temperature_c,
            load_pct=75.0,
            window_duration_s=1.0
        )
        tf1 = time.perf_counter()

        feat_vector = np.array([feat_dict[k] for k in FEATURE_NAMES], dtype=np.float32)
        X = feat_vector.reshape(1, -1)
        X_scaled = anomaly_bundle["scaler"].transform(X)

        # 2. Stage 1: Isolation Forest
        ts1_0 = time.perf_counter()
        raw_score = -anomaly_bundle["model"].score_samples(X_scaled)[0]
        ts1_1 = time.perf_counter()

        # 3. Stage 2: XGBoost Classifier
        ts2_0 = time.perf_counter()
        probs = classifier_bundle["model"].predict_proba(X)[0]
        pred_idx = int(np.argmax(probs))
        ts2_1 = time.perf_counter()

        # 4. SHAP Feature Attribution
        tsh_0 = time.perf_counter()
        shap_res = shap_explainer.explain_prediction(feat_vector, top_k=5)
        tsh_1 = time.perf_counter()

        t1 = time.perf_counter()

        # Store only post-warmup timings (in milliseconds)
        if i >= warmup_count:
            t_feat.append((tf1 - tf0) * 1000.0)
            t_stage1.append((ts1_1 - ts1_0) * 1000.0)
            t_stage2.append((ts2_1 - ts2_0) * 1000.0)
            t_shap.append((tsh_1 - tsh_0) * 1000.0)
            t_full.append((t1 - t0) * 1000.0)

    def calc_stats(arr):
        a = np.array(arr)
        return {
            "mean_ms": round(float(np.mean(a)), 3),
            "std_ms": round(float(np.std(a)), 3),
            "p50_ms": round(float(np.percentile(a, 50)), 3),
            "p95_ms": round(float(np.percentile(a, 95)), 3),
            "p99_ms": round(float(np.percentile(a, 99)), 3),
            "min_ms": round(float(np.min(a)), 3),
            "max_ms": round(float(np.max(a)), 3),
        }

    results = {
        "benchmark_metadata": {
            "benchmark_windows_evaluated": bench_count,
            "warmup_windows": warmup_count,
            "window_duration_seconds": 1.0,
            "sampling_frequency_hz": 10000,
            "samples_per_window": 10000,
            "feature_count": len(FEATURE_NAMES),
            "cpu_model": get_cpu_info(),
            "os": f"{platform.system()} {platform.release()} ({platform.version()})",
            "architecture": platform.machine(),
            "python_version": platform.python_version()
        },
        "latencies": {
            "feature_extraction": calc_stats(t_feat),
            "stage_1_anomaly_detection": calc_stats(t_stage1),
            "stage_2_fault_classification": calc_stats(t_stage2),
            "stage_4_shap_attribution": calc_stats(t_shap),
            "full_end_to_end_pipeline": calc_stats(t_full)
        }
    }

    print("[4/5] Benchmark completed. Latency summary:")
    for k, v in results["latencies"].items():
        print(f"  - {k:30s}: Mean = {v['mean_ms']:6.2f} ms | p50 = {v['p50_ms']:6.2f} ms | p95 = {v['p95_ms']:6.2f} ms")

    out_path = os.path.join(artifacts_dir, "latency_metrics.json")
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"[5/5] Saved latency metrics to {out_path}")

if __name__ == "__main__":
    main()
