"""
Dataset Generation and Partitioning Module
==========================================
Generates labeled simulation datasets with strict run-level partitioning
to guarantee zero data leakage between Train, Validation, and Test splits.
Produces:
- dataset_full.csv, dataset_train.csv, dataset_val.csv, dataset_test.csv
- dataset_combined_faults.csv (compound/simultaneous faults)
- dataset_rul.csv (multi-law progressive degradation trajectories)
- dataset_metadata.json
"""

import os
import json
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from simulator.motor_simulator import MotorSimulator, MotorParams, FAULT_CLASSES
from ml.features.feature_extractor import FeatureExtractor, FEATURE_NAMES

def generate_full_dataset(
    output_dir: str = "data/processed",
    runs_per_condition: int = 10,
    windows_per_run: int = 10,
    loads: List[float] = [25.0, 50.0, 75.0, 100.0],
    seed: int = 42
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Generate dataset across all 5 classes and 4 load levels with incipient severities.
    Runs 0-5 -> Train (60%), 6-7 -> Val (20%), 8-9 -> Test (20%).
    Strict run-level partitioning: all windows from a run stay in that split.
    """
    os.makedirs(output_dir, exist_ok=True)
    extractor = FeatureExtractor()
    records = []
    global_run_idx = 0
    rng = np.random.RandomState(seed)

    # 5 severities for faults: incipient (0.05, 0.20) to moderate/severe (0.40, 0.70, 0.95)
    fault_severities = [0.05, 0.20, 0.40, 0.70, 0.95]
    # For healthy, generate 5 operational variants (ambient temp variations, slight grid freq drift)
    healthy_variants = [
        {"name": "nominal", "temp_offset": 0.0, "freq_offset": 0.0},
        {"name": "warm_ambient", "temp_offset": 8.0, "freq_offset": 0.05},
        {"name": "cool_ambient", "temp_offset": -6.0, "freq_offset": -0.05},
        {"name": "freq_high", "temp_offset": 2.0, "freq_offset": 0.15},
        {"name": "freq_low", "temp_offset": -2.0, "freq_offset": -0.15},
    ]

    for fault_class in FAULT_CLASSES:
        if fault_class == "HEALTHY":
            conditions = [{"var": v, "sev": 0.0} for v in healthy_variants]
        else:
            conditions = [{"var": None, "sev": s} for s in fault_severities]

        for cond in conditions:
            sev = cond["sev"]
            var = cond["var"]
            for load_pct in loads:
                n_train_runs = max(1, int(0.6 * runs_per_condition))
                n_val_runs = max(1, int(0.2 * runs_per_condition))
                for run_in_cond in range(runs_per_condition):
                    global_run_idx += 1
                    cond_tag = var["name"] if var else f"sev{int(sev*100):02d}"
                    run_id = f"RUN_{fault_class[:3]}_{int(load_pct)}_{cond_tag}_r{run_in_cond:02d}_{global_run_idx:05d}"
                    
                    if run_in_cond < n_train_runs:
                        split = "train"
                    elif run_in_cond < (n_train_runs + n_val_runs):
                        split = "val"
                    else:
                        split = "test"

                    params = MotorParams()
                    if var:
                        params.ambient_temp_c += var["temp_offset"]
                        params.supply_freq_hz += var["freq_offset"]

                    sim = MotorSimulator(params=params, seed=seed + global_run_idx)

                    # Dynamic disturbance attributes per run
                    v_unbal = float(rng.uniform(0.8, 2.5))  # 0.8% - 2.5% supply unbalance
                    base_noise = float(rng.uniform(0.04, 0.07))  # SNR ~ 18-22 dB

                    for win_idx in range(windows_per_run):
                        t_start = win_idx * 1.0
                        jitter = float(rng.uniform(-0.8, 0.8))  # +/- 0.8% speed wander
                        window = sim.generate_window(
                            run_id=run_id,
                            load_pct=load_pct,
                            fault_class=fault_class,
                            severity=sev,
                            t_start=t_start,
                            noise_level=base_noise,
                            voltage_unbalance_pct=v_unbal,
                            speed_jitter_pct=jitter,
                            dc_drift=True
                        )
                        feat_dict = extractor.extract_features(
                            current_signal=window.current_signal,
                            vibration_signal=window.vibration_signal,
                            temperature_c=window.temperature_c,
                            prev_temperature_c=window.prev_temperature_c,
                            load_pct=load_pct,
                            window_duration_s=1.0
                        )
                        rec = {
                            "motor_id": window.motor_id,
                            "run_id": run_id,
                            "window_idx": win_idx,
                            "timestamp": t_start,
                            "load_pct": load_pct,
                            "severity": sev,
                            "fault_class": fault_class,
                            "fault_label": FAULT_CLASSES.index(fault_class),
                            "split": split,
                            "provenance": "Synthetic Simulation (IEEE Paper Spec 3kW 415V 50Hz Motor)"
                        }
                        rec.update(feat_dict)
                        records.append(rec)

    df = pd.DataFrame(records)

    full_path = os.path.join(output_dir, "dataset_full.csv")
    train_path = os.path.join(output_dir, "dataset_train.csv")
    val_path = os.path.join(output_dir, "dataset_val.csv")
    test_path = os.path.join(output_dir, "dataset_test.csv")

    df.to_csv(full_path, index=False)
    df[df["split"] == "train"].to_csv(train_path, index=False)
    df[df["split"] == "val"].to_csv(val_path, index=False)
    df[df["split"] == "test"].to_csv(test_path, index=False)

    metadata = {
        "total_samples": len(df),
        "total_runs": df["run_id"].nunique(),
        "train_samples": int((df["split"] == "train").sum()),
        "val_samples": int((df["split"] == "val").sum()),
        "test_samples": int((df["split"] == "test").sum()),
        "fault_classes": FAULT_CLASSES,
        "class_distribution": df["fault_class"].value_counts().to_dict(),
        "load_distribution": df["load_pct"].value_counts().to_dict(),
        "feature_names": FEATURE_NAMES,
        "incipient_severities": fault_severities,
        "runs_per_condition": runs_per_condition,
        "windows_per_run": windows_per_run,
        "provenance": "Synthetic Simulation (IEEE Paper Spec 3kW 415V 50Hz Motor with unbalance, speed wander, sensor drift)"
    }

    with open(os.path.join(output_dir, "dataset_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    return df, metadata

def generate_combined_faults_dataset(
    output_dir: str = "data/processed",
    runs_per_pair: int = 3,
    windows_per_run: int = 8,
    seed: int = 202
) -> pd.DataFrame:
    """
    Generate labeled compound/combined faults to evaluate Stage 2 classification confidence
    and test whether compound faults correctly route to UNCLASSIFIED or surface dual indications.
    """
    os.makedirs(output_dir, exist_ok=True)
    extractor = FeatureExtractor()
    records = []
    rng = np.random.RandomState(seed)

    fault_pairs = [
        (("BROKEN_ROTOR_BAR", 0.4), ("BEARING_DEFECT", 0.5)),
        (("STATOR_INTER_TURN_SHORT", 0.35), ("AIR_GAP_ECCENTRICITY", 0.45)),
        (("BEARING_DEFECT", 0.4), ("AIR_GAP_ECCENTRICITY", 0.5)),
        (("BROKEN_ROTOR_BAR", 0.3), ("STATOR_INTER_TURN_SHORT", 0.3)),
    ]

    loads = [50.0, 75.0, 100.0]
    run_idx = 0

    for pair in fault_pairs:
        (f1, s1), (f2, s2) = pair
        pair_name = f"{f1[:3]}_{f2[:3]}"
        for load_pct in loads:
            for r in range(runs_per_pair):
                run_idx += 1
                run_id = f"COMB_{pair_name}_{int(load_pct)}_r{r:02d}_{run_idx:04d}"
                sim = MotorSimulator(seed=seed + run_idx)

                for w in range(windows_per_run):
                    t_start = w * 1.0
                    window = sim.generate_window(
                        run_id=run_id,
                        load_pct=load_pct,
                        fault_class="HEALTHY",  # base overridden by combined_faults
                        severity=max(s1, s2),
                        t_start=t_start,
                        noise_level=0.05,
                        voltage_unbalance_pct=1.2,
                        combined_faults=[(f1, s1), (f2, s2)]
                    )
                    feat_dict = extractor.extract_features(
                        current_signal=window.current_signal,
                        vibration_signal=window.vibration_signal,
                        temperature_c=window.temperature_c,
                        prev_temperature_c=window.prev_temperature_c,
                        load_pct=load_pct,
                        window_duration_s=1.0
                    )
                    rec = {
                        "motor_id": window.motor_id,
                        "run_id": run_id,
                        "window_idx": w,
                        "timestamp": t_start,
                        "load_pct": load_pct,
                        "severity_primary": s1,
                        "severity_secondary": s2,
                        "fault_primary": f1,
                        "fault_secondary": f2,
                        "fault_class": "COMBINED_FAULT",
                        "split": "test_combined",
                        "provenance": "Synthetic Compound Simulation"
                    }
                    rec.update(feat_dict)
                    records.append(rec)

    df_comb = pd.DataFrame(records)
    comb_path = os.path.join(output_dir, "dataset_combined_faults.csv")
    df_comb.to_csv(comb_path, index=False)
    return df_comb

def generate_degradation_dataset(
    output_dir: str = "data/processed",
    runs_per_fault: int = 7,  # 7 * 4 = 28 runs total (16 train, 12 test)
    total_hours: float = 60.0,
    step_minutes: float = 15.0,
    seed: int = 101
) -> pd.DataFrame:
    """
    Generate progressive degradation runs for Remaining Useful Life (RUL) modeling.
    Uses multi-law wear models: Linear, Exponential, and Power-law (gamma in [1.4, 2.6]).
    28 runs total: 16 train runs, 12 test runs.
    """
    os.makedirs(output_dir, exist_ok=True)
    extractor = FeatureExtractor()
    records = []
    fault_candidates = ["BROKEN_ROTOR_BAR", "STATOR_INTER_TURN_SHORT", "BEARING_DEFECT", "AIR_GAP_ECCENTRICITY"]

    # Vary degradation laws and gammas across runs
    laws = ["power", "power", "linear", "exponential", "power", "linear", "exponential"]
    gammas = [1.5, 1.8, 1.0, 1.0, 2.4, 1.0, 1.0]

    run_counter = 0
    for fault_class in fault_candidates:
        for r in range(runs_per_fault):
            run_counter += 1
            law = laws[r % len(laws)]
            gamma = gammas[r % len(gammas)]
            run_id = f"RUL_{fault_class[:3]}_{law[:3]}_r{r+1:02d}"
            # 4 train runs, 3 test runs per fault = 16 train, 12 test
            split = "train" if r < 4 else "test"
            sim = MotorSimulator(seed=seed + run_counter)
            windows = sim.simulate_degradation_run(
                run_id=run_id,
                fault_class=fault_class,
                total_hours=total_hours,
                step_minutes=step_minutes,
                load_pct=100.0,
                degradation_law=law,
                gamma=gamma
            )
            for idx, w in enumerate(windows):
                elapsed_hours = (idx * step_minutes) / 60.0
                rul_hours = max(0.0, total_hours - elapsed_hours)
                feat_dict = extractor.extract_features(
                    current_signal=w.current_signal,
                    vibration_signal=w.vibration_signal,
                    temperature_c=w.temperature_c,
                    prev_temperature_c=w.prev_temperature_c,
                    load_pct=w.load_pct
                )
                rec = {
                    "motor_id": w.motor_id,
                    "run_id": run_id,
                    "step_idx": idx,
                    "elapsed_hours": elapsed_hours,
                    "rul_hours": rul_hours,
                    "fault_class": w.fault_class,
                    "severity": w.severity,
                    "degradation_law": law,
                    "gamma": gamma,
                    "split": split,
                    "provenance": "Synthetic Multi-Law Degradation Trajectory"
                }
                rec.update(feat_dict)
                records.append(rec)

    df_rul = pd.DataFrame(records)
    rul_path = os.path.join(output_dir, "dataset_rul.csv")
    df_rul.to_csv(rul_path, index=False)
    return df_rul

if __name__ == "__main__":
    print("Generating full multi-class and load dataset...")
    df, meta = generate_full_dataset(runs_per_condition=10, windows_per_run=10)
    print(f"Generated {len(df)} samples across {meta['total_runs']} runs.")
    print("Generating compound faults dataset...")
    df_comb = generate_combined_faults_dataset()
    print(f"Generated {len(df_comb)} compound fault samples.")
    print("Generating multi-law RUL degradation dataset...")
    df_rul = generate_degradation_dataset(runs_per_fault=7, total_hours=50.0, step_minutes=30.0)
    print(f"Generated {len(df_rul)} RUL degradation samples across {df_rul['run_id'].nunique()} runs.")
