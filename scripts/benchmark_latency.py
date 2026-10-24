"""
Benchmark Latency Script for MACHINA-X Pipeline
===============================================
Measures empirical inference latency of all candidate and production models:
1. Feature extraction (26 physics-guided features from 1-second raw windows)
2. Stage 1 Anomaly Detection: Isolation Forest & PyTorch Autoencoder
3. Stage 2 Fault Classification: XGBoost, Random Forest, SVM (RBF), and 1-D CNN
4. Stage 3 RUL Estimation: PyTorch LSTM Regressor
5. Stage 4 SHAP Feature Attribution: TreeExplainer
6. Full Production Path (Extraction -> Isolation Forest -> XGBoost -> TreeSHAP)

Measures over at least 500 windows after a 50-window warm-up.
Records exact on-disk model artifact sizes.
Saves to ml/artifacts/latency_metrics.json.
"""

import os
import sys
import time
import json
import platform
import numpy as np
import torch
import joblib

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from simulator.motor_simulator import MotorSimulator
from ml.features.feature_extractor import FeatureExtractor, FEATURE_NAMES
from ml.explainability.shap_explainer import MotorShapExplainer
from ml.training.train_autoencoder import AnomalyAutoencoder
from ml.training.train_1d_cnn import Motor1DCNN
from ml.training.train_rul_model import LSTMRULModel

def get_cpu_info():
    try:
        if platform.system() == "Windows":
            import winreg
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"HARDWARE\DESCRIPTION\System\CentralProcessor\0")
            return winreg.QueryValueEx(key, "ProcessorNameString")[0].strip()
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
    print("[1/5] Loading models and artifact bundles...")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    artifacts_dir = os.path.join(base_dir, "ml", "artifacts")

    # 1. Isolation Forest
    iso_path = os.path.join(artifacts_dir, "anomaly_detector.joblib")
    iso_bundle = joblib.load(iso_path)
    iso_model = iso_bundle["model"]
    iso_scaler = iso_bundle["scaler"]

    # 2. Autoencoder
    autoenc_model = AnomalyAutoencoder(input_dim=len(FEATURE_NAMES))
    autoenc_path = os.path.join(artifacts_dir, "autoencoder.pt")
    if os.path.exists(autoenc_path):
        autoenc_model.load_state_dict(torch.load(autoenc_path, map_location="cpu"))
    autoenc_model.eval()

    # 3. XGBoost
    xgb_path = os.path.join(artifacts_dir, "fault_classifier.joblib")
    xgb_bundle = joblib.load(xgb_path)
    xgb_model = xgb_bundle["model"]
    xgb_scaler = xgb_bundle["scaler"]

    # 4. Random Forest
    rf_path = os.path.join(artifacts_dir, "rf_model.joblib")
    rf_bundle = joblib.load(rf_path)
    rf_model = rf_bundle["model"]

    # 5. SVM
    svm_path = os.path.join(artifacts_dir, "svm_model.joblib")
    svm_bundle = joblib.load(svm_path)
    svm_model = svm_bundle["model"]

    # 6. 1-D CNN
    cnn_model = Motor1DCNN(num_classes=5)
    cnn_path = os.path.join(artifacts_dir, "cnn_1d_model.pt")
    if os.path.exists(cnn_path):
        cnn_model.load_state_dict(torch.load(cnn_path, map_location="cpu"))
    cnn_model.eval()

    # 7. LSTM RUL
    rul_path = os.path.join(artifacts_dir, "rul_lstm_model.pt")
    rul_model = LSTMRULModel(input_dim=len(FEATURE_NAMES), hidden_dim=32, num_layers=2)
    if os.path.exists(rul_path):
        rul_model.load_state_dict(torch.load(rul_path, map_location="cpu"))
    rul_model.eval()

    # 8. SHAP Explainer
    shap_explainer = MotorShapExplainer(xgb_path)
    extractor = FeatureExtractor()

    # Compute on-disk artifact sizes
    def file_size_kb(p):
        return round(os.path.getsize(p) / 1024.0, 2) if os.path.exists(p) else 0.0

    disk_sizes = {
        "isolation_forest_kb": file_size_kb(iso_path),
        "autoencoder_kb": file_size_kb(autoenc_path),
        "xgboost_kb": file_size_kb(xgb_path),
        "random_forest_kb": file_size_kb(rf_path),
        "svm_kb": file_size_kb(svm_path),
        "cnn_1d_kb": file_size_kb(cnn_path),
        "rul_lstm_kb": file_size_kb(rul_path)
    }

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
    t_iso = []
    t_autoenc = []
    t_xgb = []
    t_rf = []
    t_svm = []
    t_cnn = []
    t_rul = []
    t_shap = []
    t_full = []

    # Sequence buffer for RUL LSTM (5 steps)
    seq_buffer = [np.zeros(len(FEATURE_NAMES), dtype=np.float32) for _ in range(5)]

    for i in range(total_samples):
        w = windows[i]
        
        # Timing full production path
        t_prod_0 = time.perf_counter()

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
        X_iso_scaled = iso_scaler.transform(X)

        # 2. Stage 1: Isolation Forest
        ti0 = time.perf_counter()
        _ = iso_model.decision_function(X_iso_scaled)
        ti1 = time.perf_counter()

        # Stage 1 Baseline: Autoencoder
        X_tensor = torch.tensor(X_iso_scaled, dtype=torch.float32)
        with torch.no_grad():
            tae0 = time.perf_counter()
            _ = autoenc_model(X_tensor)
            tae1 = time.perf_counter()

        # 3. Stage 2: XGBoost
        X_xgb_scaled = xgb_scaler.transform(X)
        tx0 = time.perf_counter()
        _ = xgb_model.predict_proba(X_xgb_scaled)
        tx1 = time.perf_counter()

        # Stage 2 Baseline 1: Random Forest
        trf0 = time.perf_counter()
        _ = rf_model.predict_proba(X_xgb_scaled)
        trf1 = time.perf_counter()

        # Stage 2 Baseline 2: SVM
        tsvm0 = time.perf_counter()
        _ = svm_model.predict_proba(X_xgb_scaled)
        tsvm1 = time.perf_counter()

        # Stage 2 Baseline 3: 1-D CNN
        cur_norm = (w.current_signal - np.mean(w.current_signal)) / (np.std(w.current_signal) + 1e-6)
        vib_norm = (w.vibration_signal - np.mean(w.vibration_signal)) / (np.std(w.vibration_signal) + 1e-6)
        raw_tensor = torch.tensor(np.stack([cur_norm, vib_norm], axis=0), dtype=torch.float32).unsqueeze(0)
        with torch.no_grad():
            tcnn0 = time.perf_counter()
            _ = cnn_model(raw_tensor)
            tcnn1 = time.perf_counter()

        # 4. Stage 3: LSTM RUL
        seq_buffer.pop(0)
        seq_buffer.append(feat_vector)
        seq_tensor = torch.tensor(np.array([seq_buffer]), dtype=torch.float32)
        with torch.no_grad():
            trul0 = time.perf_counter()
            _ = rul_model(seq_tensor)
            trul1 = time.perf_counter()

        # 5. SHAP Feature Attribution
        tsh_0 = time.perf_counter()
        _ = shap_explainer.explain_prediction(feat_vector, top_k=5)
        tsh_1 = time.perf_counter()

        t_prod_1 = time.perf_counter()

        if i >= warmup_count:
            t_feat.append((tf1 - tf0) * 1000.0)
            t_iso.append((ti1 - ti0) * 1000.0)
            t_autoenc.append((tae1 - tae0) * 1000.0)
            t_xgb.append((tx1 - tx0) * 1000.0)
            t_rf.append((trf1 - trf0) * 1000.0)
            t_svm.append((tsvm1 - tsvm0) * 1000.0)
            t_cnn.append((tcnn1 - tcnn0) * 1000.0)
            t_rul.append((trul1 - trul0) * 1000.0)
            t_shap.append((tsh_1 - tsh_0) * 1000.0)
            t_full.append((t_prod_1 - t_prod_0) * 1000.0)

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
        "disk_sizes_kb": disk_sizes,
        "latencies": {
            "feature_extraction": calc_stats(t_feat),
            "stage_1_isolation_forest": calc_stats(t_iso),
            "stage_1_autoencoder": calc_stats(t_autoenc),
            "stage_2_xgboost": calc_stats(t_xgb),
            "stage_2_random_forest": calc_stats(t_rf),
            "stage_2_svm": calc_stats(t_svm),
            "stage_2_1d_cnn": calc_stats(t_cnn),
            "stage_3_lstm_rul": calc_stats(t_rul),
            "stage_4_shap_attribution": calc_stats(t_shap),
            "full_production_pipeline": calc_stats(t_full)
        }
    }

    print("[4/5] Benchmark completed. Latency summary:")
    for k, v in results["latencies"].items():
        print(f"  - {k:28s}: Mean = {v['mean_ms']:6.2f} ms | p50 = {v['p50_ms']:6.2f} ms | p95 = {v['p95_ms']:6.2f} ms")

    out_path = os.path.join(artifacts_dir, "latency_metrics.json")
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"[5/5] Saved comprehensive latency metrics to {out_path}")

if __name__ == "__main__":
    main()
